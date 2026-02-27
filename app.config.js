// Dynamic config that properly reads env vars at build time
// and embeds them into the app via expo-constants

const IS_DEV = process.env.APP_VARIANT === 'development';

// Read from app.json as base
const appJson = require('./app.json');

module.exports = ({ config }) => {
    return {
        ...config,
        ...appJson.expo,
        extra: {
            ...appJson.expo.extra,
            // This reads the env var at build time and embeds it into the JS bundle
            // via Constants.expoConfig.extra.geminiApiKey
            geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
        },
    };
};
