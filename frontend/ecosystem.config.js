module.exports = {
    apps: [
        {
            name: 'React App',
            script: 'serve',
            args: '-s build -l 8080', // Serve on port 3000
            env: {
                NODE_ENV: 'development',
            },
        },
    ],
};
