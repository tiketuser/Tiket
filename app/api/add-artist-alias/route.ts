import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { canonicalName, hebrewName, englishName, variations } =
      await request.json();

    if (!canonicalName || !hebrewName || !englishName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Path to artistMatcher.ts
    const filePath = path.join(
      process.cwd(),
      "utils",
      "artistMatcher.ts"
    );

    // Read the file
    let fileContent = fs.readFileSync(filePath, "utf-8");

    // Create the new alias entry
    const allVariations = [hebrewName, englishName, ...variations].filter(
      (v: string, i: number, arr: string[]) => arr.indexOf(v) === i
    );

    const canonical = canonicalName.toLowerCase().trim();
    const newAliasLine = `  "${canonical}": ${JSON.stringify(allVariations)},`;

    // Check if alias already exists
    if (fileContent.includes(`"${canonical}":`)) {
      return NextResponse.json(
        { error: `Alias for "${canonical}" already exists` },
        { status: 409 }
      );
    }

    // Find the ARTIST_ALIASES object and add the new entry
    // Look for the closing brace of ARTIST_ALIASES
    const aliasesRegex = /const ARTIST_ALIASES: \{ \[key: string\]: string\[\] \} = \{([\s\S]*?)\n\};/;
    const match = fileContent.match(aliasesRegex);

    if (!match) {
      return NextResponse.json(
        { error: "Could not find ARTIST_ALIASES object in file" },
        { status: 500 }
      );
    }

    // Insert the new alias before the closing brace
    const updatedAliases = match[0].replace(/\n\};/, `\n${newAliasLine}\n};`);
    fileContent = fileContent.replace(aliasesRegex, updatedAliases);

    // Write back to file
    fs.writeFileSync(filePath, fileContent, "utf-8");

    return NextResponse.json({
      success: true,
      message: "Artist alias added successfully",
      alias: { canonical, variations: allVariations },
    });
  } catch (error) {
    console.error("Error adding artist alias:", error);
    return NextResponse.json(
      { error: "Failed to add artist alias" },
      { status: 500 }
    );
  }
}
