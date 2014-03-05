var script = '';

process.stdin.on('close', function() {
   console.log(Audescript.toPureJS(script));
});

process.stdin.on('data', function(chunk) {
  script += chunk;
});