const  MessageGenerator = (textMessage, userName) => {
    const message ={
        userName,
        date: new Date().getTime(),
        textMessage
    }
   return message
}
module.exports = MessageGenerator