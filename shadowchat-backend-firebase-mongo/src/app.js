// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// const path = require("path");
// const routes = require("./routes");
// const env = require("./config/env");
// const { notFound, errorHandler } = require("./middlewares/errorHandler");
// const { initializeFirebase } = require("./config/firebase");
// const { ensureUploadsDir } = require("./services/storage.service");

// function createApp() {
//   initializeFirebase();
//   ensureUploadsDir();

//   const app = express();

//   app.use(
//     cors({
//       origin(origin, callback) {
//         if (!origin) return callback(null, true);
//         if (env.clientOrigins.includes(origin)) return callback(null, true);
//         if (origin.includes("localhost")) return callback(null, true);
//         return callback(new Error("Not allowed by CORS"));
//       },
//       credentials: true
//     })
//   );

//   app.use(helmet({
//     crossOriginResourcePolicy: false
//   }));
//   app.use(morgan("dev"));
//   app.use(express.json({ limit: "5mb" }));
//   app.use(express.urlencoded({ extended: true }));

//   app.use("/uploads", express.static(path.join(process.cwd(), env.uploadsDir)));

//   app.get("/api/health", (req, res) => {
//     res.json({
//       success: true,
//       message: "ShadowChat backend is running",
//       data: {
//         uptimeSeconds: Math.floor(process.uptime()),
//         env: env.nodeEnv
//       }
//     });
//   });

//   app.use("/api", routes);

//   app.use(notFound);
//   app.use(errorHandler);

//   return app;
// }

// module.exports = createApp;

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const { initializeFirebase } = require("./config/firebase");
const { ensureUploadsDir } = require("./services/storage.service");

function createApp() {
  initializeFirebase();
  ensureUploadsDir();

  const app = express();

  // Disable ETag for API responses to avoid 304 stale-response issues
  app.set("etag", false);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (env.clientOrigins.includes(origin)) return callback(null, true);
        if (origin.includes("localhost")) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true
    })
  );

  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );

  app.use(morgan("dev"));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Prevent caching for all API routes
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set("Surrogate-Control", "no-store");
    next();
  });

  app.use("/uploads", express.static(path.join(process.cwd(), env.uploadsDir)));

  app.get("/api/health", (req, res) => {
    res.json({
      success: true,
      message: "ShadowChat backend is running",
      data: {
        uptimeSeconds: Math.floor(process.uptime()),
        env: env.nodeEnv
      }
    });
  });

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
