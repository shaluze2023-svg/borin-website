// B站热门视频代理 - Netlify Function
const fetch = require('node-fetch');

// 随机延时函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

exports.handler = async (event, context) => {
  // CORS 头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  };

  // 处理 OPTIONS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // 随机延时 500-1500ms 避免频率限制
    await delay(500 + Math.random() * 1000);

    // 获取请求参数
    const params = event.queryStringParameters || {};
    const type = params.type || 'ranking';

    // 完整的浏览器伪装头
    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com/',
      'Origin': 'https://www.bilibili.com',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Sec-Ch-Ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site'
    };

    // 使用排行榜 API（风控相对宽松）
    const apiUrl = 'https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all';

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: browserHeaders
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const data = await response.json();
    let videos = [];
    
    if (data.code === 0 && data.data && data.data.list) {
      videos = data.data.list.slice(0, 12).map(item => ({
        bvid: item.bvid,
        title: item.title,
        cover: item.pic && item.pic.startsWith('//') ? 'https:' + item.pic : item.pic,
        duration: formatDuration(item.duration),
        up: item.owner ? item.owner.name : '未知',
        views: formatViewCount(item.stat ? item.stat.view : 0)
      }));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, count: videos.length, videos: videos })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: false, error: error.message, videos: getFallbackVideos() })
    };
  }
};

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

function getFallbackVideos() {
  return [
    { bvid: 'BV1GJ411x7h7', title: '【英雄联盟】S14全球总决赛精彩集锦', cover: '', duration: '15:30', up: '英雄联盟赛事', views: '500万' },
    { bvid: 'BV1hW411H7rA', title: '原神4.0版本全新内容前瞻直播', cover: '', duration: '45:00', up: '原神', views: '300万' },
    { bvid: 'BV1xx411c7mD', title: '今日热点：科技前沿资讯速递', cover: '', duration: '10:24', up: '科技频道', views: '100万' }
  ];
}
