var script = '';

process.stdin.on('data', function(chunk) {
  script += chunk;
});

process.stdin.on('end', function() {
   console.log(Audescript.toPureJS(script));
});
