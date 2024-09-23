import express from "express";
import session from "express-session";
import passport from "passport";
import pool from "./config/dbConfig.js";
import { userId } from "./controllers/userId.js";

const app = express();

app.use(express.static("src/public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");

// Check if user is authenticated
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/user/login");
}

// Function to add anime to user list
async function addToUserList(userId, animeId, status) {
  const client = await pool.connect();
  try {
    const existingAnime = await client.query(
      "SELECT id FROM anime_user_list WHERE user_id = $1 AND anime_id = $2",
      [userId, animeId]
    );

    let success = false;

    if (existingAnime.rows.length > 0) {
      return { success: false, message: "Anime already exists in your list!" };
    }

    if (existingAnime.rows.length === 0) {
      await client.query(
        "INSERT INTO anime_user_list (user_id, anime_id, episode, score, status) VALUES ($1, $2, $3, $4, $5)",
        [userId, animeId, 0, 0, status]
      );
      success = true;
    } else {
      console.log("Anime already exists in the list!");
    }

    if (success) {
      return {
        success: true,
        message: "Anime added to list!",
        redirectUrl: "/anime/" + animeId,
      };
    } else {
      return { success: false, message: "Error adding anime to list" };
    }
  } catch (error) {
    console.error(error);
    return { success: false, message: "Error adding anime to list" };
  } finally {
    await client.release();
  }
}

// Function to update anime details in user list
async function updateAnime(
  animeId,
  userId,
  score,
  status,
  progress,
  startDate,
  endDate
) {
  try {
    const client = await pool.connect();

    try {
      const updateQuery = `
          UPDATE anime_user_list
          SET score = $1, status = $2, episode = $3, start_date = $4, finish_date = $5
          WHERE anime_id = $6 AND user_id = $7;
        `;

      const updateResult = await client.query(updateQuery, [
        score || null,
        status,
        progress ? parseInt(progress) : null,
        startDate || null,
        endDate || null,
        animeId,
        userId,
      ]);

      if (updateResult.rowCount === 0) {
        throw new Error("Anime not found");
      }

      return { message: "Anime updated successfully" };
    } finally {
      await client.release();
    }
  } catch (error) {
    console.error("Error updating anime:", error);
    throw error;
  }
}

// Route to render home page
app.get("/", (req, res) => {
  res.render("index");
});

// Route to add anime to user list
app.post("/anime/add/:animeId", checkNotAuthenticated, async (req, res) => {
  const animeId = parseInt(req.params.animeId);
  animeId(req.params.animeId);
  const status = req.body.status || "plan_to_watch";

  const response = await addToUserList(userId, animeId, status);
  if (response.success) {
    res.send({ message: "Anime added to the list" });
    res.redirect(response.redirectUrl);
  } else {
    res.status(500).send({ message: response.message });
    res.redirect("/anime/" + animeId);
  }
});

// Route to render about page
app.get("/about", (req, res) => {
  res.render("about");
});

// Route to render contact page
app.get("/contact", (req, res) => {
  res.render("contact");
});

// Function to delete anime from user list
async function deleteAnime(animeId, userId) {
  const db = await pool.connect();
  try {
    await db.query(
      "DELETE FROM anime_user_list WHERE anime_id = $1 AND user_id = $2",
      [animeId, userId]
    );
    console.log(`Anime with ID ${animeId} deleted from user ${userId}'s list`);
  } catch (error) {
    console.error("Error deleting anime:", error);
    throw error;
  } finally {
    await db.release();
  }
}

// Route to delete anime from user list
app.post("/animes/delete", checkNotAuthenticated, async (req, res) => {
  const animeId = req.body.animeId;
  console.log(animeId);
  try {
    await deleteAnime(animeId, userId);
    res.send({ message: "Anime deleted successfully" });
    res.status(200).redirect("/users/allanime");
  } catch (error) {
    console.error("Error deleting anime:", error);
    res.status(500).send({ message: "Error deleting anime" });
    res.status(500).redirect("/users/allanime");
  }
});

// Route to render edit anime page
app.get("/animes/edit/:id", checkNotAuthenticated, async (req, res) => {
  const animeId = req.params.id;
  const anime = await getAnimeDetails(animeId);

  if (!anime) {
    return res.status(404).send("Anime not found");
  }

  res.render("edit", { anime });
});

// Route to update anime details in user list
app.post("/animes/update/:id", checkNotAuthenticated, async (req, res) => {
  const animeId = req.params.id;
  const { score, status, progress, startDate, endDate } = req.body;

  try {
    await updateAnime(
      animeId,
      userId,
      score,
      status,
      progress,
      startDate,
      endDate
    );
    res.status(200).redirect("/users/allanime");
  } catch (error) {
    console.error("Error updating anime:", error);
    res.status(500).send("Error updating anime");
  }
});

// Route to retrieve all animes from user list
app.get("/users/allanime", checkNotAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const animeList = await client.query(
      "SELECT anime_id, status, score, episode, start_date, finish_date FROM anime_user_list WHERE user_id = $1",
      [userId]
    );

    const detailedList = [];
    for (const anime of animeList.rows) {
      const animeDetails = await getAnimeDetails(anime.anime_id);
      detailedList.push({
        ...anime,
        ...animeDetails,
      });
    }
    console.log(detailedList);
    res.render("list", { list: detailedList });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching anime list" });
  } finally {
    await client.release();
  }
});

// Route to retrieve watching animes from user list
app.get("/users/watching", checkNotAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const animeList = await client.query(
      "SELECT anime_id, status, score, episode, start_date, finish_date FROM anime_user_list WHERE user_id = $1 AND status LIKE 'watching'",
      [userId]
    );

    const detailedList = [];
    for (const anime of animeList.rows) {
      const animeDetails = await getAnimeDetails(anime.anime_id);
      detailedList.push({
        ...anime,
        ...animeDetails,
      });
    }

    res.render("watching", { list: detailedList });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching anime list" });
  } finally {
    await client.release();
  }
});

// Route to retrieve completed animes from user list
app.get("/users/completed", checkNotAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const animeList = await client.query(
      "SELECT anime_id, status, score, episode, start_date, finish_date FROM anime_user_list WHERE user_id = $1 AND status LIKE 'completed'",
      [userId]
    );

    const detailedList = [];
    for (const anime of animeList.rows) {
      const animeDetails = await getAnimeDetails(anime.anime_id);
      detailedList.push({
        ...anime,
        ...animeDetails,
      });
    }

    res.render("completed", { list: detailedList });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching anime list" });
  } finally {
    await client.release();
  }
});

// Route to retrieve on-hold animes from user list
app.get("/users/onhold", checkNotAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const animeList = await client.query(
      "SELECT anime_id, status, score, episode, start_date, finish_date FROM anime_user_list WHERE user_id = $1 AND status LIKE 'on hold'",
      [userId]
    );

    const detailedList = [];
    for (const anime of animeList.rows) {
      const animeDetails = await getAnimeDetails(anime.anime_id);
      detailedList.push({
        ...anime,
        ...animeDetails,
      });
    }

    res.render("onhold", { list: detailedList });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching anime list" });
  } finally {
    await client.release();
  }
});

// Route to retrieve dropped animes from user list
app.get("/users/dropped", checkNotAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const animeList = await client.query(
      "SELECT anime_id, status, score, episode, start_date, finish_date FROM anime_user_list WHERE user_id = $1 AND status LIKE 'dropped'",
      [userId]
    );

    const detailedList = [];
    for (const anime of animeList.rows) {
      const animeDetails = await getAnimeDetails(anime.anime_id);
      detailedList.push({
        ...anime,
        ...animeDetails,
      });
    }

    res.render("dropped", { list: detailedList });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching anime list" });
  } finally {
    await client.release();
  }
});

// Route to retrieve planned animes from user list
app.get("/users/plantowatch", checkNotAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const animeList = await client.query(
      "SELECT anime_id, status, score, episode, start_date, finish_date FROM anime_user_list WHERE user_id = $1 AND status LIKE 'plan to watch'",
      [userId]
    );

    const detailedList = [];
    for (const anime of animeList.rows) {
      const animeDetails = await getAnimeDetails(anime.anime_id);
      detailedList.push({
        ...anime,
        ...animeDetails,
      });
    }

    res.render("plantowatch", { list: detailedList });
  } catch (error) {
    console.error(error);
    res.render("error", { message: "Error fetching anime list" });
  } finally {
    await client.release();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
