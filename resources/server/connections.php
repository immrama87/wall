<?php
	switch($_SERVER['REQUEST_METHOD']){
		case "GET":
			$file = fopen("../data/connections.json", "r") or die(generateResponse("success", json_encode(array('connections'=>array()))));
			$contents = fread($file, filesize("../data/connections.json")) or die(generateResponse("success", json_encode(array('connections'=>array()))));
			fclose($file);
			echo generateResponse("success", $contents);
			break;
		case "PUT":
			parse_str(file_get_contents("php://input"),$post_vars);
			writeConnection($post_vars['Name'], $post_vars['Url']);
			break;
		case "DELETE":
			parse_str(file_get_contents("php://input"),$post_vars);
			deleteConnection($post_vars['Name']);
			break;
	}
	
	function writeConnection($name, $url){
		$new_connection = array('name'=>$name,'url'=>$url);
		if(file_exists("../data/connections.json")){
			updateFile($name, $new_connection);
		}
		else {
			$data = array('connections'=>array($new_connection));
			echo json_encode($data);
			writeFile(json_encode($data));
		}
		echo generateResponse("success", json_encode($new_connection));
	}
	
	function updateFile($name, $new_connection){
		$file = fopen("../data/connections.json", "r");
		$contents = fread($file, filesize("../data/connections.json"));
		fclose($file);
		
		$json = json_decode($contents);
		
		$found = false;
		foreach($json->connections as $i => $connection){
			if($connection->name == $name){
				$found = true;
				break;
			}
		}
		if(!$found){
			array_push($json->connections, $new_connection);
			writeFile(json_encode($json));
		}
		else{
			die(generateResponse("error", "A connection with the name ".$name." already exists."));
		}
	}
	
	function deleteConnection($name){
		$file = fopen("../data/connections.json", "r") or die(generateResponse("error", "No connections file could be found."));
		$contents = fread($file, filesize("../data/connections.json"));
		fclose($file);
		
		$json = json_decode($contents);
		$new_connections = array();
		
		$found = false;
		foreach($json->connections as $i => $connection){
			if($connection->name == $name){
				$found = true;
			}
			else {
				array_push($new_connections, array('name'=>$connection->name,'url'=>$connection->url));
			}
		}
		if($found){
			writeFile(json_encode(array('connections'=>$new_connections)));
			echo generateResponse("success", json_encode(array('name'=>$name)));
		}
		else {
			die(generateResponse("error", "No connection with the name ".$name." was found."));
		}
	}
	
	function writeFile($data){
		$file = fopen("../data/connections.json", "w") or die(generateResponse("error", "Error writing to file."));
		fwrite($file, $data);
		fclose($file);
	}
	
	function generateResponse($status, $data){
		$response = array('status'=>$status, 'data'=>$data);
		
		return json_encode($response);
	}
?>