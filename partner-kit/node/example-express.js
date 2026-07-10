"use strict";

/**
 * Tiket Connect — mounting into an existing Express app.
 *
 * The one rule: mount the middleware BEFORE express.json() (or any other body
 * parser). The HMAC signature is computed over the raw request bytes, so the
 * kit must read the stream itself.
 */

const express = require("express");
const { createTiketConnect } = require("./tiket-connect");

const app = express();

const connect = createTiketConnect({
  secret: process.env.TIKET_CONNECT_SECRET,
  lookupTicket: async (barcode) => {
    // Your database lookup here — see example-standalone.js for the shape.
    return null;
  },
});

// ✅ Tiket routes first — the middleware only claims /tiket/* and passes
// everything else through untouched.
app.use(connect.middleware);

// …then the rest of your app as usual.
app.use(express.json());
app.get("/", (req, res) => res.send("existing app"));

app.listen(process.env.PORT || 3000);
