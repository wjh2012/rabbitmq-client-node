const http = require('http');
const amqp = require('amqplib/callback_api');

let args = process.argv.slice(2);

const PORT = args[0]||"3000";
const RECEIVE_KEY = args[1] ||"";
const SEND_KEY = args[2] || "toMid.info";
const DELAY = args[3] || 5000;

const AMQP_URL = 'amqp://admin:admin@localhost';
const EXCHANGE = 'test_channel';

let channel = null;

// RabbitMQ 연결 및 채널 생성
amqp.connect(AMQP_URL, (err, connection) => {
  if (err) {
    console.error('Failed to connect to RabbitMQ:', err);
    process.exit(1);
  }

  connection.createChannel((err, ch) => {
    if (err) {
      console.error('Failed to create channel:', err);
      process.exit(1);
    }

    channel = ch;

    // 교환기 생성
    channel.assertExchange(EXCHANGE, 'topic', { durable: false });
  });
});

// HTTP 라우트 핸들러
const handleHomeRoute = (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Welcome to the Home Page!\n');
};

const handleSend = (data) => {
  const msg = data;
  if (channel) {
    channel.publish(EXCHANGE, SEND_KEY, Buffer.from(msg));
    console.log(` [x] Sent ${SEND_KEY}:'${msg}'`);
  }
};

const handleNotFoundRoute = (req, res) => {
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('404 Not Found\n');
};

// HTTP 서버 생성
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    handleHomeRoute(req, res);
  } else if (req.method === 'GET' && req.url === '/send') {
    handleSend("START");
  } else {
    handleNotFoundRoute(req, res);
  }
});

// 서버를 지정된 포트에서 실행
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
