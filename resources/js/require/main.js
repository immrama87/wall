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
		}
	]
});

var WindowManager;

require(['connectionManager', 'windowManager'], function(ConnectionManager, wm){
	WindowManager = wm;
	ConnectionManager.init();
});