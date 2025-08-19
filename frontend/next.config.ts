// frontend/next.config.js
const withMDX = require("@next/mdx")();
module.exports = withMDX({
  pageExtensions: ["ts", "tsx", "mdx"],
});
