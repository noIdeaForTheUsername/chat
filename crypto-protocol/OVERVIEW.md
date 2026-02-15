# OVERVIEW

## !!! DISCLAIMER:
**This is a HOBBISTIC PROJECT, not a product with guarranted security.** I was learning cryptography for a while before making this project but I'm NOT an expert cryptographer and the entire protocol may have critical flaws that I'm not aware of. If you find any, please don't bother to let me know. Do not treat the app as secure for any serious or high-scale use

------------------------------------------------

## THREAT MODEL

### What is covered by the threat model
The cryptographic part is mainly used to protect the **messages content** from the app's **server** or anyone else who could access the data outside of the user's device. Cryptography is supposed to provide messages' secrecy and authenticity. It includes protecting against:
- passive interception (full encryption of messages text)
- modifying the data by the server (authentication of almost all data exchanged with the server)
- replaying or reordering messages, deleting data without user's knowledge (messages, contacts or conversations)
- the server replaying the entire old state (partially)
- other active attacks such as Man-in-the-middle (partially - **Trust On First Use** with manual verification option by public keys comparison)


### What is NOT covered
Protection against:
- Metadata exposure (who chats with who, how often and how long are the messages)
- Delaying data delivery (if done by the server without reordering or further tampering)
- A replay of an entire old state, done by the server for a newly logged-in device of an existing user
- Client-side attacks, malware or phishing - anyone that accesses the device's memory, or gets the user's password, will be able to decrypt the messages and break authentication. Additionally, web applications don't have access to hardware secure storage, so the persistently stored cryptographics keys aren't protected well.

Additionally, the app **doesn't provide Perfect Forward Secrecy or Post-Compromise Security** - a compromise of the user's keys allows to decrypt the entire chat history. This is purposeful because this is a web application and it can't fully rely on persistent data storage on the user's device. It's supposed to be synchronizable easily. Therefore, all the data is server-stored in some form and correct credentials allow full access.

## DIAGRAMS INFORMATION
