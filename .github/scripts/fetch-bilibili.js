const https = require('https');

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.JSONBIN_BIN_ID;

// 浏览器请求头
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  'Referer': 'https://www.bilibili.com/',
  'Origin': 'https://www.bilibili.com',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
};

// 获取B站热门视频
function fetchBilibili() {
  return new Promise((resolve, reject) => {
    const url = 'https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all';
    
    const req = https.request(url, { headers, method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.code === 0 && json.data && json.data.list) {
            const videos = json.data.list.slice(0, 12).map(item => ({
              bvid: item.bvid,
              title: item.title,
              cover: item.pic && item.pic.startsWith('//') ? 'https:' + item.pic : item.pic,
              duration: formatDuration(item.duration),
              up: item.owner ? item.owner.name : '未知',
              views: formatViewCount(item.stat ? item.stat.view : 0)
            }));
            resolve(videos);
          } else {
            reject(new Error('API返回错误: ' + json.message));
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
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

// 更新JSONBin
async function updateJSONBin(videos) {
  return new Promise((resolve, reject) => {
    // 先获取现有数据
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
          
          // 更新bilibili字段
          record.bilibili = {
            updated: new Date().toISOString(),
            videos: videos
          };
          
          // 写回JSONBin
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
              console.log('JSONBin updated successfully');
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

// 主函数
async function main() {
  console.log('Fetching Bilibili hot videos...');
  const videos = await fetchBilibili();
  console.log('Got', videos.length, 'videos');
  
  console.log('Updating JSONBin...');
  await updateJSONBin(videos);
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
