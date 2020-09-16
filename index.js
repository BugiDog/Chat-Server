const app = require('express')()
const server = app.listen(5000, () => console.log(`Server started on 5000 port`))
const io = require('socket.io').listen(server)

const chatRooms = new Map([
    ['usersName',[]],
    ['roomsId' , []],
    ['rooms', new Map()]
])

io.on('connection', (socket) => {

    console.log('connection--------------');

    socket.on('joinChatRoom', data => {
        console.log('DATA=',data);
        if (chatRooms.get('usersName').includes(data.name)){
            console.log('ERROR--------------','Имя занято');
            socket.emit('error',{message: 'Имя занято'})
            return(0)        
        }
        chatRooms.get('usersName').push(data.name)
        if (!data.roomId) {
            const roomId=new Date().getTime()
            chatRooms.get('rooms').set(roomId, 
                new Map([
                    ['users', [data.name]],
                    ['message', {}]
                ])
            )
            socket.emit('ChatRoomData',chatRooms.get('rooms').get(roomId))
            

        } else {

        }

        console.log(chatRooms);
    })
})