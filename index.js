const app = require('express')()
const server = app.listen(5000, () => console.log(`Server started on 5000 port`))
const io = require('socket.io').listen(server)

const MessageGenerator = require('./Functions/MessageGenerator')

const chatRooms = new Map()


const sendChatRoomData = (socket, roomId) => {   //отправляет основной пакет данный новым пользователям
    socket.emit('ChatRoomData', {
        roomId,
        usersNames: [...chatRooms.get(roomId).get('users').values()],
        messages: [...chatRooms.get(roomId).get('message')]
    })
}

const idGenerator = () => {
    return Math.random().toString(36).substr(2, 9);
};

io.on('connection', (socket) => {

    console.log('connection--------------');

    socket.on('createChatRoom', (userName) => {                         // создается новая комната
        console.log('createChatRoom=', userName);

        const roomId = new Date().getTime().toString()  
        chatRooms.set(roomId,                                          
            new Map([
                ['users', new Map()],
                ['message', []]
            ])
        )
        socket.join(roomId)                                             // сокет подкулючается к каналу
        const newUserId = idGenerator()
        chatRooms.get(roomId).get('users').set(newUserId, userName)     // добавляется новый пользователь в комнату
        sendChatRoomData(socket, roomId)
        socket.emit('userId', newUserId)
    })

    socket.on('joinChatRoom', ({ userName, roomId }) => {               // пользователь подключается к существующей комнате
        console.log('joinChatRoom=', userName, '---', roomId);

        if (chatRooms.has(roomId)) {
            socket.join(roomId)
            const newUserId = idGenerator()
            chatRooms.get(roomId).get('users').set(newUserId, userName) // добавляется новый пользователь в комнату
            sendChatRoomData(socket, roomId)
            socket.emit('userId', newUserId)
            socket.broadcast.to(roomId).emit('newUser', userName)       // имя нового пользователя отправляется членам комнаты
        } else {
            console.log('ERROR=', 'Room not found');
            socket.emit('newError', { message: 'Room not found' })
            return 0
        }
    })

    socket.on('reconnectToRoom', (userId) => {                          // пользователь переподключается к существующей комнате
        console.log('reconnectToRoom=', '---', userId);

        for (let [key, room] of chatRooms) {                            // ищется комната по ID пользователя
            if (room.get('users').has(userId)) {
                socket.join(key)
                sendChatRoomData(socket, key)
            }
        } 
    })

    socket.on('sendMessage', ({ textMessage, roomId, userId }) => {      // отправка новых сообщений
        console.log('sendMessage=', textMessage, '---', roomId);

        const message = MessageGenerator(textMessage, chatRooms.get(roomId).get('users').get(userId))
        chatRooms.get(roomId).get('message').push(message)               // добавление нового сообщения в историю чата
        message.date = new Date(message.date).toTimeString().split('', 5).join('')
        io.in(roomId).emit('newMessage', { message })
    }) 

    socket.on('disconnectUser', ({userId, roomId}) => {                   // отключение пользователя от чата
        console.log('disconnectUser=', userId,'---',roomId );

        socket.leave(roomId)
        socket.broadcast.to(roomId).emit('userDisconnect',  chatRooms.get(roomId).get('users').get(userId)) // уведомление членов чата о выходе пользователя
        chatRooms.get(roomId).get('users').delete(userId)
       
    })
})