const app = require('express')()
const server = app.listen(5000, () => console.log(`Server started on 5000 port`))
const io = require('socket.io').listen(server)

//const CheckUserName = require('./Functions/CheckUserName')

const chatRooms = new Map([
    ['userInRoom', new Map()],
    ['rooms', new Map()]
])
const rooms=chatRooms.get('rooms')
const userInRoom=chatRooms.get('userInRoom')

const sendChatRoomData = (socket,roomId) => {
    socket.emit('ChatRoomData', { 
        roomId,
        usersNames : [...rooms.get(roomId).get('users').values()] , 
        message: [...rooms.get(roomId).get('message')]
    })
}

io.on('connection', (socket) => {

    console.log('connection--------------');

    socket.on('createChatRoom', ( userName ) => {
        console.log('userName=', userName);
 
        const roomId = new Date().getTime().toString()
        console.log(typeof(roomId));
        rooms.set(roomId,
            new Map([
                ['users', new Map()],
                ['message', []]
            ])
        )
        socket.join(roomId)
        userInRoom.set(socket.id, roomId)
        rooms.get(roomId).get('users').set(socket.id,userName)
        sendChatRoomData(socket, roomId)
        console.log(rooms.get(roomId), roomId);
    })
 
    socket.on('joinChatRoom', ({ userName, roomId }) => {
        console.log('DATA=', userName,'---',roomId);
        socket.join(roomId)
        
        console.log(rooms.get(roomId));
        rooms.get(roomId).get('users').set(socket.id,userName)
        sendChatRoomData(socket, roomId)
        socket.broadcast.to(roomId).emit('newUser', userName)

  
        console.log(rooms.get(roomId), roomId);
    })
})