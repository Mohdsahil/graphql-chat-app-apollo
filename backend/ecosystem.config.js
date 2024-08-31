module.exports = {
    apps: [
        { 
            name: 'Graphql Chat App', 
            script: "./index.js",
            env: { // environment variable
                NODE_ENV: 'development',
            },
        }
    ]
}