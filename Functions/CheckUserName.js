const CheckUserName = (userName, usersNames) => {
    if (usersNames.includes(userName)) {
        console.log('ERROR--------------', 'Имя занято');
        return (0)
    } else {
        return (1)
    }
}