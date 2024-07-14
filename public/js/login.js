function login(username){
    axios.post('/login',
    {
        username : username
    })

}  
function register(username){
    axios.post('/register',{
        username : username
    })
}
