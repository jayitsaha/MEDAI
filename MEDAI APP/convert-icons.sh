for svg in assets/**/*.svg; do
  png="${svg%.svg}.png"
  magick -background none "$svg" "$png"
done