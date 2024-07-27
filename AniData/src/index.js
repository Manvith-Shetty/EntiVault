import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import path from "path";
import animeId from "./controllers/animeId";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 8001;

app.use(express.static("src/public"));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "views"));

const cache = new Map();
const cacheDuration = 60 * 60 * 1000;
const rateLimitDelay = 1000;

app.get("/anime/search", async (req, res) => {
  const searchTerm = req.query.q;

  try {
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime?q=${searchTerm}`
    );
    const searchResults = response.data.data.map((anime) => ({
      id: anime.mal_id,
      title: anime.title,
      image: anime.images?.jpg?.image_url,
      synopsis: anime.synopsis,
      rank: anime.rank,
      popularity: anime.popularity,
      gener: anime.genres.map((genre) => genre.name),
      episodes: anime.episodes,
      duration: anime.duration,
      rating: anime.score,
      type: anime.type,
      members: anime.members,
    }));

    res.render("search", { results: searchResults }); // Render search template
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error fetching search results" });
  }
});

async function getAnimeDetails(animeId) {
  const cachedData = cache.get(animeId);
  if (cachedData && Date.now() - cachedData.timestamp < cacheDuration) {
    return cachedData.data;
  }
  await new Promise((resolve) => setTimeout(resolve, rateLimitDelay));
  try {
    const response = await axios.get(
      `https://api.jikan.moe/v4/anime/${animeId}`
    );

    const animeData = response.data.data;

    const coverImageUrl = animeData.images?.jpg?.image_url;

    const anime = {
      id: animeData.mal_id,
      title: animeData.title,
      description: animeData.synopsis,
      rank: animeData.rank,
      popularity: animeData.popularity,
      genre: animeData.genres.map((genre) => genre.name),
      episodes: animeData.episodes,
      duration: animeData.duration,
      rating: animeData.score,
      coverImage: coverImageUrl,
      background: animeData.background,
      type: animeData.type,
    };

    return anime;
  } catch (error) {
    console.error("Error fetching anime details:", error);
    return null;
  }
}

app.get("/anime/:animeId", async (req, res) => {
  try {
    const animeInfo = await getAnimeDetails(animeId);
    res.render("anime", { anime: animeInfo });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error fetching anime details" });
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

app.listen(PORT, () => {
  console.log(`AniData service running on port ${PORT}`);
});
