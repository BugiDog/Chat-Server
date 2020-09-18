const app = require('express')()
const server = app.listen(5000, () => console.log(`Server started on 5000 port`))
const io = require('socket.io').listen(server)

const MessageGenerator = require('./Functions/MessageGenerator')

const chatRooms = new Map([
    ['userInRoom', new Map()],
    ['rooms', new Map()]
])
const rooms = chatRooms.get('rooms')
const userInRoom = chatRooms.get('userInRoom')

const sendChatRoomData = (socket, roomId) => {
    socket.emit('ChatRoomData', {
        roomId,
        usersNames: [...rooms.get(roomId).get('users').values()],
        messages: [...rooms.get(roomId).get('message')]
    })
}

io.on('connection', (socket) => {

    console.log('connection--------------');

    socket.on('createChatRoom', (userName) => {
        console.log('createChatRoom=', userName);

        const roomId = new Date().getTime().toString()
        console.log(typeof (roomId));
        rooms.set(roomId,
            new Map([
                ['users', new Map()],
                ['message', []]
            ]) 
        )
        socket.join(roomId)
        userInRoom.set(socket.id, roomId)
        rooms.get(roomId).get('users').set(socket.id, userName)
        sendChatRoomData(socket, roomId)
    })
 
    socket.on('joinChatRoom', ({ userName, roomId }) => {
        console.log('joinChatRoom=', userName, '---', roomId);

        if (rooms.has(roomId)){
            socket.join(roomId)
            console.log(rooms.get(roomId));
            rooms.get(roomId).get('users').set(socket.id, userName)
            sendChatRoomData(socket, roomId)
            socket.broadcast.to(roomId).emit('newUser', userName)
        } else {
            console.log('ERROR=', 'Room not found');
            socket.emit('newError', {message:'Room not found'})
            return 0
        }

        
    })

    socket.on('sendMessage', ({ textMessage, roomId }) => {

        console.log('sendMessage=', textMessage, '---', roomId);
        const message = MessageGenerator(textMessage,rooms.get(roomId).get('users').get(socket.id))
        rooms.get(roomId).get('message').push(message)
        message.date = new Date(message.date).toTimeString().split('', 5).join('')
        console.log('message=',message);
        io.in(roomId).emit('newMessage',{ message})
    
    })    


})