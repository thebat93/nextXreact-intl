const { readFileSync, readdirSync } = require("fs");
const { basename } = require('path')
const next = require("next");
const express = require("express");
const appRouter = express.Router();
const cookieParser = require("cookie-parser");
const createLocaleMiddleware = require("express-locale");
const flatten = require('flat')
const port = parseInt(process.env.PORT, 10) || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const INTERNAL_PREFIXES = [/^\/_next\//, /^\/static\//];

const isNextjsUrl = url => {
  for (const prefix of INTERNAL_PREFIXES) {
    if (prefix.test(url)) {
      return true;
    }
  }

  return false;
};

// Доступные языки
const supportedLanguages = {
  en: "en-GB",
  ru: "ru-RU",
  fr: "fr-FR"
};

// We need to expose React Intl's locale data on the request for the user's
// locale. This function will also cache the scripts by lang in memory.
const localeDataCache = new Map();
const getLocaleDataScript = locale => {
  const lang = locale.split("-")[0];
  if (!localeDataCache.has(lang)) {
    const localeDataFile = require.resolve(
      `@formatjs/intl-relativetimeformat/dist/locale-data/${lang}`
    );
    const localeDataScript = readFileSync(localeDataFile, "utf8");
    localeDataCache.set(lang, localeDataScript);
  }
  return localeDataCache.get(lang);
};


// Считываем файлы локалей по страницам, кладем их в один объект и делаем его плоским
// https://github.com/formatjs/react-intl/issues/1104
let messages = {};

Object.keys(supportedLanguages).forEach(lang => {
  const files = readdirSync(__dirname + '/public/lang/en');
  messages[lang] = {};
  files.forEach(file => {
    const page = basename(file, '.json');
    const content = readFileSync(__dirname + `/public/lang/${lang}/` + file, 'utf-8');
    messages[lang][page] = JSON.parse(content);
  });
  messages[lang] = flatten(messages[lang])
});

// Middleware для определения языка на основе куки, Accept-Language (с фолбэком)
// https://github.com/smhg/express-locale
const localeMiddleware = createLocaleMiddleware({
  priority: ["cookie", "map", "accept-language", "default"],
  default: supportedLanguages.en,
  map: supportedLanguages,
  cookie: {
    name: "i18next"
  },
  allowed: [...Object.keys(supportedLanguages), ...Object.values(supportedLanguages)]
});

// Middleware для определения языка на основе роута
const pathLocaleMiddleware = (req, res, next) => {
  if (Object.keys(supportedLanguages).includes(req.params.lang)) {
    req.locale = req.params.lang;
  }
  next();
};

// Это якобы роуты нашего приложения
appRouter.get("*", (req, res, next) => {
  if (req.locale) {
    req.localeDataScript = getLocaleDataScript(req.locale)
    req.messages = {
      [req.locale]: messages[req.locale]
    };
    return handle(req, res)
  }
  next();
});

const bootstrap = async () => {
  await app.prepare();
  const server = express();

  server.use(cookieParser());

  // Для загрузки локалей с фронта
  server.get('/locales/:locale', (req, res) => {
    const locale = req.params.locale;
    res.send(messages[locale]);
  });

  // Роуты с языковым ключом
  server.use("/:lang/", pathLocaleMiddleware, appRouter);

  // Роуты без языкового ключа (для редиректа)
  server.use(localeMiddleware);

  server.get("*", (req, res) => {
    if (isNextjsUrl(req.url)) {
      return handle(req, res)
    }

    // Редирект для роутов без языкового ключа
    if (!req.path.includes('favicon.ico')) {
      return res.redirect(`/${req.locale.language}${req.path}`);
    }

    res.status(400).send();
  });

  server.listen(port, err => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
};

bootstrap();
