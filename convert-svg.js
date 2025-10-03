const fs = require('fs');
const { execSync } = require('child_process');

// Try to use a web-based conversion approach or install a converter
try {
  // Install sharp temporarily
  console.log('Installing sharp for SVG conversion...');
  execSync('npm install sharp --no-save', { stdio: 'inherit' });
  
  const sharp = require('sharp');
  
  // Convert SVG to PNG - Variant 3
  sharp('typeorm-thumbnail-variant3.svg')
    .png()
    .resize(1200, 630, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toFile('typeorm-linkedin-thumbnail.png')
    .then(() => {
      console.log('✅ Successfully converted SVG to PNG!');
      console.log('📁 Output: typeorm-linkedin-thumbnail.png');
      
      // Clean up
      execSync('npm uninstall sharp --no-save', { stdio: 'pipe' });
    })
    .catch(err => {
      console.error('❌ Error converting SVG:', err);
    });
    
} catch (error) {
  console.error('❌ Error setting up conversion:', error.message);
  console.log('\n💡 Alternative: You can manually convert the SVG file using:');
  console.log('   - Online converter like https://cloudconvert.com/svg-to-png');
  console.log('   - Or install ImageMagick: brew install imagemagick');
  console.log('   - Then run: convert typeorm-release-thumbnail.svg typeorm-release-thumbnail.png');
}
