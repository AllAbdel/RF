const winston = require('winston');
const path = require('path');

// Définir les couleurs personnalisées pour chaque niveau
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Format pour la console (coloré et lisible)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Format pour les fichiers (JSON structuré)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Déterminer le niveau de log selon l'environnement
const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Créer le dossier logs s'il n'existe pas
const logsDir = path.join(__dirname, '../logs');

// Configuration des transports
const transports = [
  // Console: tous les logs
  new winston.transports.Console({
    format: consoleFormat,
    level: level
  }),
  
  // Fichier: erreurs seulement
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Fichier: tous les logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Créer le logger
const logger = winston.createLogger({
  level: level,
  levels: winston.config.npm.levels,
  transports: transports,
  exitOnError: false
});

// Créer le dossier logs au démarrage
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Fonctions utilitaires de logging
const logRequest = (req, message = 'Request') => {
  logger.http(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id || 'anonymous'
  });
};

const logError = (error, context = {}) => {
  logger.error(error.message || error, {
    stack: error.stack,
    ...context
  });
};

const logDB = (operation, table, duration = null) => {
  const meta = { operation, table };
  if (duration) meta.duration = `${duration}ms`;
  logger.debug('Database query', meta);
};

const logAuth = (action, userId, success = true) => {
  const level = success ? 'info' : 'warn';
  logger[level](`Auth: ${action}`, { userId, success });
};

// Export
module.exports = {
  logger,
  logRequest,
  logError,
  logDB,
  logAuth,
  // Alias pratiques
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  http: logger.http.bind(logger),
  debug: logger.debug.bind(logger)
};
