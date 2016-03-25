[Demo and API docs](http://artanis.github.io/socket-io/)

# &lt;socket-io&gt;
`<socket-io>` connects to a Socket.IO server and forwards received
events into the Polymer event model.


## Use
To avoid conflicts with other events, incoming messages are prefixed
with `io-`, so add event listeners for `io-<incoming-message-name>`.

Specify which events to listen to with `forwarding`:

```html
<socket-io
  auto-connecting forwarding='["new message", "user joined"]'
  on-io-new-message="handleNewMessage"
  on-io-user-joined="handleUserJoined">
</socket-io>
```

Or use `auto-forwarding`:

```html
<socket-io
  auto-connecting auto-forwarding
  on-io-new-message="handleNewMessage"`
  on-io-user-joined="handleUserJoined">`
</socket-io>
```

The auto-forwarding feature may not function as you expect, due to the
some workarounds it uses. Please see the
[`auto-forwarding` implementation notes](#feature-auto-forwarding) for
more information.

## Implementation Notes

### Feature: Auto-forwarding

Auto-forwarding can only be done if `<socket-io>` can figure out what
events it needs to forward on its own, or if it can listen to *all*
events and forward them blindly.

This leads to some interesting problems:

First, an element *can't* know what events it's parent is listening to
(the `on-<event-name>` notation is processed by the parent), so
`<socket-io>` can't use that notation to subscribe to the Socket.IO
message. There is no way around this.

Second, Socket.IO has no official or public method to listen to all
incoming events. There *is* support server side for [middleware that are
called for all incoming
packets](https://github.com/hden/socketio-wildcard), but nothing similar
for the browser.

This may change in the future; the Socket.IO team does not seem to be
opposed to this capability, but was unable to decide between something
like `addGlobalListener()` or `io.on('*', [...])`. Mirroring middleware
feature to the browser would also support this.

In the meantime, there *is* a way to do it. By listening to the same
event the Socket object itself listens to, all incoming packets can be
examined (this is similar to having middleware support browser-side):

```javascript
var socket = io();
socket.io.on('packet', function(packet) {
  // This event is fired immediately after a packet is fully parsed.
});
```

**This event is a low-level firehose**. It fires for all packets, not
just packets from the server. Doing this also bypasses the processing
the Socket object adds (currently the receive buffer feature). Any
events that get buffered by the socket won't get picked up when the
socket re-emits them.
