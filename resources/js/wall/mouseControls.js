define("wallManager/MouseControls", ["wallManager/ScrollBars"], function(ScrollBar){
	var mc = {};
	
	var activeSticky = null;
	var stickyController = null;
	var canvas = null;
	var scrollbars = null;
	var viewport = null;
	var scrollSpeed = 20;
	
	mc.init = function(cvs, sm, sb, vp){
		canvas = cvs;
		stickyController = sm;
		scrollbars = sb;
		viewport = vp;
		
		$(window).off("mousedown");
		$(window).on("mousedown", mousedown);
		$(window).off("mousemove");
		$(window).on("mousemove", checkAllBounds);
		$(window).off("mousewheel");
		$(window).on("mousewheel", mousescroll);
	}
	
	mc.getActive = function(){
		return activeSticky;
	}
	
	function setActive(sticky){
		if(sticky != null){
			$(canvas).addClass("hover");
		}
		else {
			$(canvas).removeClass("hover");
			$(window).off("mousemove");
			$(window).on("mousemove", checkAllBounds);
		}
		activeSticky = sticky;
	}
	
	function mousedown(evt){
		evt = viewport.normalizeMouseEvent(evt);
		if(evt.shiftKey){
		}
		else if(scrollbars.x.isHovered(evt.viewportX, evt.viewportY)){
			grabScrollX(evt);
		}
		else if(scrollbars.y.isHovered(evt.viewportX, evt.viewportY)){
			grabScrollY(evt);
		}
		else if(activeSticky != null){
			activeSticky.offsets = activeSticky.grab(evt);
			stickyController.liftSticky(activeSticky);
			$(window).off("mousemove");
			//$(window).on("mousemove", moveSticky);
			$(window).off("mouseup");
			//$(window).on("mouseup", dropSticky);
		}
	}
	
	function checkAllBounds(evt){
		evt = viewport.normalizeMouseEvent(evt);
		setActive(stickyController.checkBounds(evt));
	}
	
	function grabScrollX(evt){
		scrollbars.x.offset = evt.viewportX;
		$(window).off("mousemove");
		$(window).on("mousemove", scrollX);
		$(window).off("mouseup");
		$(window).on("mouseup", releaseScroll);
	}
	
	function grabScrollY(evt){
		scrollbars.y.offset = evt.viewportY;
		$(window).off("mousemove");
		$(window).on("mousemove", scrollY);
		$(window).off("mouseup");
		$(window).on("mouseup", releaseScroll);
	}
	
	function scrollX(evt){
		evt = viewport.normalizeMouseEvent(evt);
		viewport.updateX(evt, scrollbars.x.offset);
		scrollbars.x.offset = evt.viewportX;
	}
	
	function scrollY(evt){
		evt = viewport.normalizeMouseEvent(evt);
		viewport.updateY(evt, scrollbars.y.offset);
		scrollbars.y.offset = evt.viewportY;
	}
	
	function releaseScroll(evt){
		$(window).off("mouseup");
		$(window).off("mousemove");
		$(window).on("mousemove", checkAllBounds);
	}
	
	function mousescroll(evt){
		evt = viewport.normalizeMouseEvent(evt);
		
		if(evt.ctrlKey){
			evt.preventDefault();
			viewport.updateZoom(0.1 * evt.deltaY, evt);
		}
		if(evt.shiftKey){
			evt.viewportX = evt.deltaX * scrollSpeed;
			viewport.updateX(evt, 0);
		}
		else {
			evt.viewportY = evt.deltaY * -1 * scrollSpeed;
			viewport.updateY(evt, 0);
		}
	}
	
	function moveSticky(evt){
		evt = viewport.normalizeMouseEvent(evt);
		activeSticky.updatePosition(evt, activeSticky.offsets);
		stickyController.draw();
	}
	
	function dropSticky(evt){
		evt = viewport.normalizeMouseEvent(evt);
		stickyController.dropSticky(activeSticky, evt);
		$(window).off("mouseup");
		$(window).off("mousemove");
		$(window).on("mousemove", checkAllBounds);
	}
	
	return mc;
});