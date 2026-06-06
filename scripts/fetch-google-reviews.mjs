import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputPath = path.join(projectRoot, "public", "data", "google-reviews.json");

const apiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
const placeId = process.env.GOOGLE_PLACE_ID?.trim();
const profileUrl = process.env.GOOGLE_PROFILE_URL?.trim() || "";
const businessName = process.env.GOOGLE_BUSINESS_NAME?.trim() || "Somos Soluciones Contables";
const languageCode = process.env.GOOGLE_REVIEWS_LANGUAGE?.trim() || "es";

if (!apiKey) {
    throw new Error("Falta GOOGLE_MAPS_API_KEY en el entorno.");
}

if (!placeId) {
    throw new Error("Falta GOOGLE_PLACE_ID en el entorno.");
}

const endpoint = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
endpoint.searchParams.set("languageCode", languageCode);

const fieldMask = "displayName,rating,userRatingCount,reviews";

const response = await fetch(endpoint, {
    headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
        Accept: "application/json"
    }
});

if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Places devolvio ${response.status}: ${errorBody}`);
}

const payload = await response.json();
const reviews = Array.isArray(payload.reviews) ? payload.reviews.slice(0, 5).map(normalizeReview).filter((review) => review.text) : [];
const numericRating = toNumber(payload.rating);
const totalReviews = toNumber(payload.userRatingCount) ?? reviews.length;
const fiveStarReviews = reviews.filter((review) => toNumber(review.rating) === 5).length;

const output = {
    generatedAt: new Date().toISOString(),
    isPlaceholder: false,
    businessName: readText(payload.displayName?.text) || businessName,
    profileUrl,
    rating: numericRating ?? 0,
    totalReviews,
    fiveStarReviews,
    reviews
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");

console.log(`Resenas actualizadas en ${outputPath}`);
console.log(`Rating: ${output.rating} | Total: ${output.totalReviews} | Resenas visibles: ${output.reviews.length}`);

function normalizeReview(review) {
    const authorName = readText(review.authorAttribution?.displayName) || "Cliente de Google";
    const rating = normalizeRating(review.rating);
    const text = readText(review.originalText?.text) || readText(review.text?.text);

    return {
        authorName,
        initials: buildInitials(authorName),
        rating,
        text,
        dateLabel: readText(review.relativePublishTimeDescription) || formatDateLabel(review.publishTime),
        authorPhotoUrl: readText(review.authorAttribution?.photoUri) || "",
        reviewUrl: readText(review.authorAttribution?.uri) || profileUrl
    };
}

function normalizeRating(value) {
    const numeric = toNumber(value);

    if (numeric !== null) {
        return Math.max(1, Math.min(5, numeric));
    }

    if (typeof value === "string") {
        const enumMap = {
            ONE: 1,
            TWO: 2,
            THREE: 3,
            FOUR: 4,
            FIVE: 5,
            ONE_STAR: 1,
            TWO_STARS: 2,
            THREE_STARS: 3,
            FOUR_STARS: 4,
            FIVE_STARS: 5
        };

        return enumMap[value.toUpperCase()] || 5;
    }

    return 5;
}

function toNumber(value) {
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function readText(value) {
    return typeof value === "string" ? value.trim() : "";
}

function buildInitials(name) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "GC";
}

function formatDateLabel(value) {
    if (!value) {
        return "Google";
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return "Google";
    }

    return parsed.toLocaleDateString("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}
