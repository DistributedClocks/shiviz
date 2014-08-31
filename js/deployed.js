var dev = false;

///////////////////// Google analytics snippet:
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
								     m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
															      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-42254712-3', 'bitbucket.org');
ga('send', 'pageview');
////////////////////

// NOTE: the string ZZZ below is replaced with the current revision id
// during deployment. Do not change the value of version without
// updating the deploy_shiviz.py script.
var versionText="revision: ZZZ";