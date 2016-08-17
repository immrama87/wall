require.config({
	baseUrl:	'./resources/js',
	packages:		[
		{
			name:		'connectionManager',
			location:	'./connections',
			main:		"ConnectionManager"
		},
		{
			name:		'wallManager',
			location:	'./wall/',
			main:		"WallManager"
		},
		{
			name:		'stickies',
			location:	'./stickies',
			main:		"StickyManager"
		},
		{
			name:		'windowManager',
			location:	'./windowManager',
			main:		"WindowManager"
		},
		{
			name:		'notificationManager',
			location:	'./notificationManager',
			main:		'NotificationManager'
		}
	]
});

var WindowManager, NotificationManager;

require(['connectionManager', 'windowManager', 'notificationManager'], function(ConnectionManager, wm, nm){
	WindowManager = wm;
	NotificationManager = nm;
	ConnectionManager.init();
});