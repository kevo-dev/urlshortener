# Fupisha — URL Shortener Microservice

A small Express + MongoDB URL-shortening service originally built as a freeCodeCamp backend project.

## What it does
- Accepts valid HTTP(S) URLs and creates compact short codes.
- Reuses an existing short code for the same destination.
- Redirects `/api/shorturl/:shortURL` to the stored destination.
- Serves a minimal browser UI.
- Exposes `/health` for deployment monitoring.

## API
### Create
`POST /api/shorturl/new` with form field `url`.

Returns JSON containing `original_url` and `short_url`.

### Redirect
`GET /api/shorturl/:shortURL` redirects to the saved destination.

### Health
`GET /health` returns service and database readiness without exposing credentials.

## Local development
1. Install Node.js.
2. Run `npm ci`.
3. Create `.env` with `MONGO_URI=<your MongoDB connection string>`.
4. Run `npm start` or `npm run dev`.

The service uses `PORT` when provided, otherwise 3000.

## Engineering notes
The API trims and validates input before database work, uses Express's built-in parsers, creates a unique indexed short code, handles duplicate creation races, fails fast when MongoDB is unavailable, and returns consistent JSON API errors.

## License
MIT
