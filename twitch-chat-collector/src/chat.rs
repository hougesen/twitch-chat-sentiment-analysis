use std::{
    net::TcpStream,
    sync::{Arc, Mutex},
};
use tungstenite::{connect, stream::MaybeTlsStream, Message, WebSocket};
use url::Url;

use crate::queue::Queue;

pub fn socket_thread(
    mut channel_join_queue: Queue<String>,
    message_queue: Arc<Mutex<Queue<(Message, u64)>>>,
) -> Result<(), tungstenite::Error> {
    let (mut socket, _response) =
        connect(Url::parse("wss://irc-ws.chat.twitch.tv:443").unwrap()).expect("Can't connect");

    login_to_twitch(&mut socket)?;

    loop {
        if !channel_join_queue.is_empty() {
            while !channel_join_queue.is_empty() {
                if let Some(channel) = channel_join_queue.dequeue() {
                    socket.write_message(
                        Message::Text(format!("JOIN #{}", &channel.to_lowercase())).into(),
                    )?;
                }
            }
        }

        if let Ok(message) = socket.read_message() {
            let timestamp = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs();

            if message.is_text() {
                message_queue.lock().unwrap().enqueue((message, timestamp));
            }
        }
    }
}

fn login_to_twitch(
    socket: &mut WebSocket<MaybeTlsStream<TcpStream>>,
) -> Result<(), tungstenite::Error> {
    let client_token = dotenv::var("CLIENT_TOKEN").expect("Missing env CLIENT_TOKEN");
    let client_username = dotenv::var("CLIENT_USERNAME").expect("Missing env CLIENT_USERNAME");

    socket.write_message(Message::Text(format!("PASS oauth:{}", &client_token)))?;

    socket.write_message(Message::Text(format!("NICK {}", &client_username)).into())?;

    Ok(())
}
