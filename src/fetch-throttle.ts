// The exported function takes as input a function and returns a
// function returning a Promise that automatically delays calls to the
// original function such that the rate is kept below the specified
// number of calls in the specified number of milliseconds.
export function fetchthrottle(
  f: Function,
  calls: number,
  milliseconds: number
) {
  var queue: any[] = [];
  var complete: any[] = [];
  var inflight = 0;

  var processQueue = function () {
    // Remove old complete entries.
    var now = Date.now();
    while (complete.length && complete[0] <= now - milliseconds)
      complete.shift();

    // Make calls from the queue that fit within the limit.
    while (queue.length && complete.length + inflight < calls) {
      var request = queue.shift();
      ++inflight;

      // Call the deferred function, fulfilling the wrapper Promise
      // with whatever results and logging the completion time.
      var p = f.apply(request.this, request.arguments);
      complete.push(now);
      --inflight;
      Promise.resolve(p).then(
        (result) => {
          request.resolve(result);
        },
        (error) => {
          request.reject(error);
        }
      );
      if (queue.length && complete.length === 1)
        setTimeout(processQueue, milliseconds);
    }

    // Check the queue on the next expiration.
    if (queue.length && complete.length)
      setTimeout(processQueue, complete[0] + milliseconds - now);
  };

  return function (...args: any) {
    return new Promise((resolve, reject) => {
      queue.push({
        arguments: args,
        resolve: resolve,
        reject: reject,
      });

      processQueue();
    });
  };
}
