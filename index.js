const app = require('express')()
const server = app.listen(5000, () => console.log(`Server started on 5000 port`))
const io = require('socket.io').listen(server)

const MessageGenerator = require('./Functions/MessageGenerator')

const chatRooms = new Map()


const sendChatRoomData = (socket, roomId) => {
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

    socket.on('createChatRoom', (userName) => {
        console.log('createChatRoom=', userName);

        const roomId = new Date().getTime().toString()
        chatRooms.set(roomId,
            new Map([
                ['users', new Map()],
                ['message', []]
            ])
        )
        socket.join(roomId)
        const newUserId = idGenerator()
        chatRooms.get(roomId).get('users').set(newUserId, userName)
        sendChatRoomData(socket, roomId)
        socket.emit('userId', newUserId)
    })

    socket.on('joinChatRoom', ({ userName, roomId }) => {
        console.log('joinChatRoom=', userName, '---', roomId);

        if (chatRooms.has(roomId)) {
            socket.join(roomId)
            const newUserId = idGenerator()
            chatRooms.get(roomId).get('users').set(newUserId, userName)
            sendChatRoomData(socket, roomId)
            socket.emit('userId', newUserId)
            socket.broadcast.to(roomId).emit('newUser', userName)
        } else {
            console.log('ERROR=', 'Room not found');
            socket.emit('newError', { message: 'Room not found' })
            return 0
        }
    })

    socket.on('reconnectToRoom', (userId) => {
        console.log('reconnectToRoom=', '---', userId);

        for (let [key, room] of chatRooms) {
            if (room.get('users').has(userId)) {
                socket.join(key)
                sendChatRoomData(socket, key)
            }
        } 
    })

    socket.on('sendMessage', ({ textMessage, roomId, userId }) => {
        console.log('sendMessage=', textMessage, '---', roomId);

        const message = MessageGenerator(textMessage, chatRooms.get(roomId).get('users').get(userId))
        chatRooms.get(roomId).get('message').push(message)
        message.date = new Date(message.date).toTimeString().split('', 5).join('')
        io.in(roomId).emit('newMessage', { message })
    }) 

    socket.on('disconnectUser', ({userId, roomId}) => {
        console.log('disconnectUser=', userId,'---',roomId );

        
        socket.leave(roomId)
        socket.broadcast.to(roomId).emit('userDisconnect',  chatRooms.get(roomId).get('users').get(userId))
        chatRooms.get(roomId).get('users').delete(userId)
   
    })
})