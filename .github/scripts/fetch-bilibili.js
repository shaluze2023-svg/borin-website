const https = require('https');

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com/'
};

// 使用推荐接口（更稳定）
function fetchBilibili() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.bilibili.com/x/web-interface/wbi/index/top/rcmd?ps=12';
    
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 0 && json.data && json.data.item) {
            const videos = json.data.item.slice(0, 12).map(item => ({
              bvid: item.bvid,
              title: item.title,
              cover: item.pic && item.pic.startsWith('//') ? 'https:' + item.pic : item.pic || '',
              duration: formatDuration(item.duration),
              up: item.owner ? item.owner.name : '未知',
              views: formatViewCount(item.stat ? item.stat.view : 0)
            }));
            resolve(videos);
          } else {
            reject(new Error('API error: ' + (json.message || json.code)));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins + ':' + String(secs).padStart(2, '0');
}

function formatViewCount(count) {
  if (!count) return '0';
  if (count >= 100000000) return (count / 100000000).toFixed(1) + '亿';
  if (count >= 10000) return (count / 10000).toFixed(1) + '万';
  return String(count);
}

async function updateJSONBin(videos) {
  return new Promise((resolve, reject) => {
    const getUrl = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}/latest`;
    
    https.get(getUrl, {
      headers: { 'X-Master-Key': JSONBIN_API_KEY }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const existing = JSON.parse(data);
          const record = existing.record || {};
          
          record.bilibili = {
            updated: new Date().toISOString(),
            videos: videos
          };
          
          const postData = JSON.stringify(record);
          const putUrl = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
          
          const req = https.request(putUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'X-Master-Key': JSONBIN_API_KEY,
              'Content-Length': Buffer.byteLength(postData)
            }
          }, (res2) => {
            let result = '';
            res2.on('data', chunk => result += chunk);
            res2.on('end', () => {
              console.log('JSONBin updated');
              resolve();
            });
          });
          
          req.on('error', reject);
          req.write(postData);
          req.end();
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('Fetching Bilibili videos...');
  const videos = await fetchBilibili();
  console.log('Got', videos.length, 'videos');
  for (const v of videos.slice(0, 5)) {
    console.log('  -', v.bvid, v.title.slice(0, 30));
  }
  
  console.log('Updating JSONBin...');
  await updateJSONBin(videos);
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
