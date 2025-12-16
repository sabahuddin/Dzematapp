const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname),
  '@/components': path.resolve(__dirname, 'components'),
  '@/constants': path.resolve(__dirname, 'constants'),
  '@/hooks': path.resolve(__dirname, 'hooks'),
  '@/services': path.resolve(__dirname, 'services'),
  '@/assets': path.resolve(__dirname, 'assets'),
};

module.exports = config;
