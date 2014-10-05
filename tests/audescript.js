var script = '';

process.stdin.on('close', function() {
   console.log(audescript.toPureJS(script));
});

process.stdin.on('data', function(chunk) {
  script += chunk;
});
