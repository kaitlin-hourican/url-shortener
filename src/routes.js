const express = require("express");
const router = express.Router();
const db = require("./db");
const { customAlphabet } = require("nanoid");

router.get("/", (req, res) => {
    res.json("home page");
});

router.post("/", (req, res) => {
    res.json("create slug");

    const { url, customSlug } = req.body;

    // check if real url
    if (!isUrlValid(url)) {
        return res.status(400).send({ sucess: false, message: "Invalid URL" });
    }

    // check if random or custom slug
    // if custom:
    if (customSlug) {
        // sanitise custom
        const cleanSlug = santiseSlug(customSlug);

        if (cleanSlug.length > 30) {
            return res.status(400).send({ sucess: false, message: "Custom URL is longer than 30 characters" });
        }

        // check if already exists in db
        if (doesSlugExist(cleanSlug)) {
            return res.status(400).send({ success: false, message: "URL already exists" });

        }

        // custom doesnt exist, add to database + tell user of success
        addSlugToDB(cleanSlug, url);

    }
    // if random


        // create random slug
        // check if exists - if not, continue, if yes, generate new slug
        // add to db
        // tell user successful
})

router.get("/:slug", (req, res) => {
    res.json("slug redirect")
})



// helper function

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

async function doesSlugExist(slug) {
    try {
        const [rows] = await db.query(`SELECT * FROM short_url WHERE slug = ?;`, slug);

        if (rows.length === 0) {
            res.status(200).json({
                success: true,
                message: "Database connection successful, slug does not exist"
            });

            return false;
        }

        res.status(200).json({
            success: true,
            message: "Database connection successful, slug does exist"
        });

        return true;

    } catch (error) {
        console.error("Database error: ", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
}

function generateSlug() {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz-';

    return customAlphabet(alphabet, 10);
}

async function addSlugToDB(slug, url) {
    try {
        await db.query(`INSERT INTO short_url (slug, url) VALUE ?, ?`, [slug, url]);

    } catch (error) {
        console.error("Database error: ", error);

        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
}

module.exports = router;