const express = require("express");
const router = express.Router();
const db = require("./db");
const { customAlphabet } = require("nanoid");

const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz-';
const generateStr = customAlphabet(alphabet, 10);

const MAX_ATTEMPTS = 15;

router.post("/", async (req, res) => {
    const { url, customSlug } = req.body;

    // check if real url
    if (!isUrlValid(url)) {
        return res.status(400).send({ success: false, message: "Invalid URL" });
    }

    // check if random or custom slug
    let newSlug;

    // if custom:
    if (customSlug) {
        // sanitise custom
        newSlug = santiseSlug(customSlug);

        if (newSlug.length > 30) {
            return res.status(400).send({ sucess: false, message: "Custom URL is longer than 30 characters" });
        }
    }


    try {
        const result = await addNewUrl(url, newSlug); 
        
        res.status(201).json({ success: true, message: `Successfully created ${result.slug}` });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
    
})

router.get("/:slug", async (req, res) => {
    try {
        const { slug } = req.params;

        const [rows] = await db.query("SELECT url FROM short_url WHERE slug = ?;", [slug]);

        if (rows.length > 0) {
            const [result] = await db.query("UPDATE short_url SET click_counter = click_counter + 1 WHERE slug = ?;", [slug]);

            res.redirect(rows[0].url);
        } else {
            return res.status(404).json({ success: false, message: "URL not found"});
        }

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
})



// helper functions

function isUrlValid(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function santiseSlug(slug) {
    return slug
        .toString()
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, '') 
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9 ]/g, '') 
        .replace(/\s+/g, '-')
        .replace(/-{2,}/g, "-")
        .replace(/^-+|-+$/g, ''); 
}

async function insertUrl(url, slug) {
    const [result] = await db.query(`INSERT INTO short_url (slug, url) VALUES (?, ?);`, [slug, url]);

    return result;
}

async function addNewUrl(url, customSlug) {
    const isCustom = customSlug !== undefined;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const slug = isCustom ? customSlug : generateStr();

        try {
            await insertUrl(url, slug);

            return { slug };
        } catch (error) {
            if (error.code !== "ER_DUP_ENTRY") {
                throw error;
            }

            if (isCustom) {
                throw new Error("URL already taken. Try again.");
            }

            continue;
        }
    }

     throw new Error("Failed to generate a unique URL.");

}

module.exports = router;