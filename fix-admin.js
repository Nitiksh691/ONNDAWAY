const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const colorMap = {
  '#18181b': '#ffffff',
  '"#111"': '"#ffffff"',
  '#27272a': '#e2e8f0',
  '#3f3f46': '#cbd5e1',
  '#1f1f23': '#f8fafc',
  'color: "#fff"': 'color: "#0f172a"',
  'color: "#e4e4e7"': 'color: "#334155"',
  'color: "#a0a0a0"': 'color: "#64748b"',
  'color: "#71717a"': 'color: "#64748b"',
  'color: "#a1a1aa"': 'color: "#94a3b8"',
  'color: "#d4d4d8"': 'color: "#334155"',
  '#1e3a5f': '#c7d2fe',
  '#0a0f2e': '#eef1ff',
  '#0f172a 100%': '#dbeafe 100%',
  'color: "#fff",': 'color: "#0f172a",',
  'color: "#e4e4e7",': 'color: "#334155",',
  'color: "#a0a0a0",': 'color: "#64748b",',
  'color: "#71717a",': 'color: "#64748b",',
  'color: "#a1a1aa",': 'color: "#94a3b8",',
  'color: "#d4d4d8",': 'color: "#334155",'
};

walkDir('./src/app/admin', function(filePath) {
  if (filePath.endsWith('.tsx') && !filePath.includes('layout.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // Replace all keys in colorMap
    for (const [key, value] of Object.entries(colorMap)) {
      newContent = newContent.split(key).join(value);
    }
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      console.log('Updated', filePath);
    }
  }
});
