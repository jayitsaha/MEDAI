#!/bin/bash

# Create the base asset directories

mkdir -p assets/images/pregnancy/yoga
mkdir -p assets/images/pregnancy/diet
mkdir -p assets/images/pregnancy/baby-development
mkdir -p assets/images/pregnancy/fruits
mkdir -p assets/icons
mkdir -p assets/fonts

# Create the MEDAI Logo
cat > assets/images/common/medai-logo.svg << 'EOL'
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6A5ACD" />
      <stop offset="100%" stop-color="#FF69B4" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="90" fill="white" stroke="url(#logoGradient)" stroke-width="6"/>
  <path d="M50 80C50 68.9543 58.9543 60 70 60H130C141.046 60 150 68.9543 150 80V120C150 131.046 141.046 140 130 140H70C58.9543 140 50 131.046 50 120V80Z" fill="url(#logoGradient)" opacity="0.2"/>
  <path d="M75 65L75 135" stroke="url(#logoGradient)" stroke-width="8" stroke-linecap="round"/>
  <path d="M125 65L125 135" stroke="url(#logoGradient)" stroke-width="8" stroke-linecap="round"/>
  <path d="M75 100H125" stroke="url(#logoGradient)" stroke-width="8" stroke-linecap="round"/>
  <path d="M65 80L135 80" stroke="url(#logoGradient)" stroke-width="8" stroke-linecap="round"/>
  <path d="M65 120L135 120" stroke="url(#logoGradient)" stroke-width="8" stroke-linecap="round"/>
  <path d="M100 65L100 135" stroke="url(#logoGradient)" stroke-width="8" stroke-linecap="round"/>
</svg>
EOL

# Create the App Icon
cat > app-icon.svg << 'EOL'
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6A5ACD" />
      <stop offset="100%" stop-color="#FF69B4" />
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="white"/>
  <circle cx="512" cy="512" r="384" fill="url(#iconGradient)" opacity="0.9"/>
  <path d="M337 448C337 403.817 372.817 368 417 368H607C651.183 368 687 403.817 687 448V576C687 620.183 651.183 656 607 656H417C372.817 656 337 620.183 337 576V448Z" fill="white" opacity="0.9"/>
  <path d="M417 368L417 656" stroke="url(#iconGradient)" stroke-width="32" stroke-linecap="round"/>
  <path d="M607 368L607 656" stroke="url(#iconGradient)" stroke-width="32" stroke-linecap="round"/>
  <path d="M417 512H607" stroke="url(#iconGradient)" stroke-width="32" stroke-linecap="round"/>
  <path d="M367 448L657 448" stroke="url(#iconGradient)" stroke-width="32" stroke-linecap="round"/>
  <path d="M367 576L657 576" stroke="url(#iconGradient)" stroke-width="32" stroke-linecap="round"/>
  <path d="M512 368L512 656" stroke="url(#iconGradient)" stroke-width="32" stroke-linecap="round"/>
</svg>
EOL

# Create the Splash Screen
cat > splash.svg << 'EOL'
<svg width="1242" height="2436" viewBox="0 0 1242 2436" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6A5ACD" />
      <stop offset="100%" stop-color="#FF69B4" />
    </linearGradient>
  </defs>
  <rect width="1242" height="2436" fill="url(#splashGradient)"/>
  <circle cx="621" cy="1118" r="200" fill="white"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M521 1018C521 962.772 565.772 918 621 918C676.228 918 721 962.772 721 1018V1218C721 1273.23 676.228 1318 621 1318C565.772 1318 521 1273.23 521 1218V1018ZM571 968L571 1268M671 968L671 1268M571 1118H671M541 1018L701 1018M541 1218L701 1218M621 968L621 1268" stroke="url(#splashGradient)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="621" y="1500" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="80" fill="white">MEDAI</text>
</svg>
EOL

# Create Common Assets
cat > assets/images/common/logo-simple.svg << 'EOL'
<svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="simpleLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6A5ACD" />
      <stop offset="100%" stop-color="#FF69B4" />
    </linearGradient>
  </defs>
  <circle cx="40" cy="40" r="36" fill="white" stroke="url(#simpleLogoGradient)" stroke-width="3"/>
  <path d="M20 32C20 27.5817 23.5817 24 28 24H52C56.4183 24 60 27.5817 60 32V48C60 52.4183 56.4183 56 52 56H28C23.5817 56 20 52.4183 20 48V32Z" fill="url(#simpleLogoGradient)" opacity="0.2"/>
  <path d="M30 26L30 54" stroke="url(#simpleLogoGradient)" stroke-width="3" stroke-linecap="round"/>
  <path d="M50 26L50 54" stroke="url(#simpleLogoGradient)" stroke-width="3" stroke-linecap="round"/>
  <path d="M30 40H50" stroke="url(#simpleLogoGradient)" stroke-width="3" stroke-linecap="round"/>
  <path d="M26 32L54 32" stroke="url(#simpleLogoGradient)" stroke-width="3" stroke-linecap="round"/>
  <path d="M26 48L54 48" stroke="url(#simpleLogoGradient)" stroke-width="3" stroke-linecap="round"/>
  <path d="M40 26L40 54" stroke="url(#simpleLogoGradient)" stroke-width="3" stroke-linecap="round"/>
</svg>
EOL

# Create Alzheimer's Icons
cat > assets/images/alzheimers/medication-reminder.svg << 'EOL'
<svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="medReminderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5E72E4" />
      <stop offset="100%" stop-color="#825EE4" />
    </linearGradient>
  </defs>
  <rect width="300" height="200" rx="20" fill="white"/>
  <rect x="50" y="50" width="100" height="100" rx="10" fill="url(#medReminderGradient)"/>
  <rect x="80" y="30" width="40" height="20" rx="5" fill="url(#medReminderGradient)"/>
  <path d="M100 50V150" stroke="white" stroke-width="8" stroke-linecap="round"/>
  <path d="M50 100H150" stroke="white" stroke-width="8" stroke-linecap="round"/>
  <circle cx="200" cy="100" r="50" fill="url(#medReminderGradient)" opacity="0.2" stroke="url(#medReminderGradient)" stroke-width="4"/>
  <path d="M200 70V100" stroke="url(#medReminderGradient)" stroke-width="6" stroke-linecap="round"/>
  <path d="M200 100L220 120" stroke="url(#medReminderGradient)" stroke-width="6" stroke-linecap="round"/>
</svg>
EOL

cat > assets/images/alzheimers/safe-zone-map.svg << 'EOL'
<svg width="600" height="400" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="safeZoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#11CDEF" />
      <stop offset="100%" stop-color="#1171EF" />
    </linearGradient>
  </defs>
  <rect width="600" height="400" rx="20" fill="#E8F4F8"/>
  <circle cx="300" cy="200" r="120" stroke="url(#safeZoneGradient)" stroke-width="6" stroke-dasharray="15 15" fill="url(#safeZoneGradient)" opacity="0.1"/>
  <rect x="280" y="180" width="40" height="40" rx="5" fill="url(#safeZoneGradient)"/>
  <path d="M100 100L200 150L300 100L400 150L500 100" stroke="#999" stroke-width="4"/>
  <path d="M100 150L200 200L300 150L400 200L500 150" stroke="#999" stroke-width="4"/>
  <path d="M100 200L200 250L300 200L400 250L500 200" stroke="#999" stroke-width="4"/>
  <path d="M100 250L200 300L300 250L400 300L500 250" stroke="#999" stroke-width="4"/>
  <circle cx="250" cy="250" r="10" fill="#FF6B6B"/>
</svg>
EOL

# Create Pregnancy Assets
cat > assets/images/pregnancy/yoga/pose-1.svg << 'EOL'
<svg width="400" height="300" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="yogaPoseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF69B4" />
      <stop offset="100%" stop-color="#FFD1DC" />
    </linearGradient>
  </defs>
  <rect width="400" height="300" rx="20" fill="#FFF9F9"/>
  <circle cx="200" cy="80" r="25" fill="url(#yogaPoseGradient)"/>
  <path d="M200 105V150" stroke="url(#yogaPoseGradient)" stroke-width="6" stroke-linecap="round"/>
  <path d="M150 200L200 150L250 200" stroke="url(#yogaPoseGradient)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M120 250L200 150L280 250" stroke="url(#yogaPoseGradient)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="200" y="280" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="16" fill="#FF69B4">Cat-Cow Pose</text>
</svg>
EOL

# Create Water Icons
cat > assets/icons/water.svg << 'EOL'
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69z" fill="#87CEFA" stroke="#4682B4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
EOL

# Create Medication Icons
cat > assets/icons/medication.svg << 'EOL'
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="6" width="18" height="12" rx="2" fill="#6A5ACD"/>
  <line x1="12" y1="8" x2="12" y2="16" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
EOL

# Create Location Icons
cat > assets/icons/location.svg << 'EOL'
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#11CDEF" stroke="#1171EF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="10" r="3" fill="white"/>
</svg>
EOL

# Create placeholder files
# Alzheimer's placeholders
for file in emergency-contact.svg memory-journal.svg fall-detection.svg; do
  echo "<!-- Placeholder for $file -->" > assets/images/alzheimers/$file
done

# Create pill placeholders
mkdir -p assets/images/alzheimers/pills
for color in blue red yellow white; do
  echo "<!-- Placeholder for pill-$color.svg -->" > assets/images/alzheimers/pills/pill-$color.svg
done

# Pregnancy placeholders
# Additional yoga poses
for i in 2 3; do
  echo "<!-- Placeholder for pose-$i.svg -->" > assets/images/pregnancy/yoga/pose-$i.svg
done

# Diet placeholders
for meal in breakfast lunch dinner snack; do
  echo "<!-- Placeholder for meal-$meal.svg -->" > assets/images/pregnancy/diet/meal-$meal.svg
done

# Baby development placeholders
for week in 8 12 20 30 40; do
  echo "<!-- Placeholder for week-$week.svg -->" > assets/images/pregnancy/baby-development/week-$week.svg
done

# Fruit comparison placeholders
for fruit in raspberry lime avocado papaya; do
  echo "<!-- Placeholder for $fruit.svg -->" > assets/images/pregnancy/fruits/$fruit.svg
done

# Create additional icon placeholders
for icon in calendar emergency yoga diet chat home settings profile notification logout; do
  echo "<!-- Placeholder for $icon.svg -->" > assets/icons/$icon.svg
done

# Create onboarding placeholders
for file in background.jpg alzheimers-card.png pregnancy-card.png welcome-illustration.png; do
  echo "<!-- Placeholder for $file -->" > assets/images/onboarding/$file
done

# Create profile placeholders
for file in placeholder-avatar.png default-profile.png; do
  echo "<!-- Placeholder for $file -->" > assets/images/common/$file
done

echo "Asset directory structure and files created successfully!"