if (typeof (UnitTestsApplication) != "undefined") {
	UnitTestsApplication.registerModule({ label: 'Authentication', execute: executeAuthenticationTests, 
		warning: "This module may conflict with each of other modules\nin parallel mode. It is  better to run it standalone.",
		baseSystemOnly : true
	});
}

if (typeof envianceSdk == "undefined")
	envianceSdk = {};

if (typeof authConfig == "undefined")
	authConfig = {};

function executeAuthenticationTests() {
	module("Authentication Service", {
		setup: function () {
			this.accessUserName = authConfig.accessUserName || this.accessUserName;

			var qUnitDbSuffix = QUnit.urlParams.dbsuffix || "";
			this.mustChangePasswordUser = (this.mustChangePasswordUser || "jstestsMustChangePasswordUser") + qUnitDbSuffix;
			this.tempPasswordUser = (this.tempPasswordUser || "jstestsTempPasswordUser") + qUnitDbSuffix;
			
			this.password = authConfig.password || "1111";
			this.certificateUniqueId = "EldoS Corporation-00-AB-B6-C5-13-05-DC-60-48-8F-A3-35-83-45-A7-E6-A6";
			this.encryptedJstestsAccessUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCAGCSqGSIb3DQEHAaATBBFqc3Rlc3RzQWNjZXNzVXNlcjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgATlzgoph2Lok7O3CCP35ezCu9awSBok7oyp6ja2qCYAMKHbZ2x8HzXj5abXEPffIfgO/XgDvV05Ytxf1tJcr6qPwpxMjFGJu5aFDtj5U/5QJn7sZ1rsmI42EudlnBwGsHP4UYnY4vPugc2f4FWPdje9S/57Ng8GRnKcxSapMnDYAAAAAAAA"; //jstestsAccessUser

			switch (qUnitDbSuffix) {
				case "_copy1":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5MTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgA8y3uFVH/8QswvvN6FMeju58KGeKLqnvjP8npVbnvNSZXjd05Ur+a8grub9Jq6JlxkVdAHnSBaY2Y/8jgqLWaS+fjfEwnk69mI0sH5fo0q9aEfRr/goRdfuYIRMnrBbnXp7QNd4LBkqLpplCCLSqFrtpZPbCqqzV0RbyuqY/zryAAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5MTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgAxYeoecwGHkY+X/YDKgiphHyyUXLoYIlCedG1EC1EvJ9Q5+0Eqs9nOkFi9i4eQtguNkZFT3sSks5SlTfPFSAbVF5985bFOQtgcJRUBxbH8w3QZJah52j3RNHSsL0TdYzsa9Tr7cjVKgVlVi2EkGvM57wGQD0JazGWMSVEGF3Vr5AAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTExgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYBHyEF9VIu06CGfFOdT2bXlIBi1ovvhuiLIqofe/d5bCtwGPpndYZOxScutzQhQ1yrk0lt+w9hB3lkxjPCBL9StefstIsocmqIzDj1leM7avaqry/uN9+q75pO893sQ2elotArpz8HfLxjxRZCIPAyjPVZvCXnE0CZUnRQt6qaQlQAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5MTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgADId3Wo0dhnLpL7hVTetAG8DGnmZ2geGmJizTJDhTWmNf92201RlxmkI5yxrBziXpZata8bi0wgbzZx8JciV/EsYI8dC6N3j6Z9THXmatPakLLhtoKxnPXAGGEROVp8PEvLnK16xOSY+/P8xINlNILBN3F2q96+DfMd7e79haudAAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy2":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5MjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgBGcrjLPfgR2W06jHvQfWH4ZQhPPeUrVlp6s3l76P0YzXygnC6SwdKX4Qprznb/qwtPlJ7//fNzaqgq89ufY17PpKG6Zsy5R5y6NfU2JJcBS/I3GcZKSzzpg4Hdp8LexkhPA19fSsm2xm9xOSlTwu5qlavHJUnG2015cUlf5SCcXAAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5MjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgEtDyffRuuYEuXLLBnUyNT7PR81g2GxXVEk3wIDnDOdIzYYQTiRsQpWlXPLwuZ0eLOfv5vGpump1NwnqRSUu5TSK12Ij16Qs3X9BvILf4bFuQIUY3kRUorJS82NHBKc2RdaaiVT226qzhPw6X/vymCqFDGtMOHbKUUlrH+UeRq17AAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTIxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYAQfJVHd4Pd1dzGWjTW5UtidoWEq6SHDHcam/Rv1V2xyX1NUFS3IXlY6Fk8DzV3WE+Owf4wh8HDaGMzx+LYG4x7usPkNHTBRSmjxsMZbUK5UmO+z9jYsqOxB9p6oCUI2ENiSM//B3V7KDfgdetgUOQXmpMac04b4sS29VauCvxKNAAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5MjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgFEWeaGQa9otct0rzb3TSCtnKKgSVoORqjD/ue73l8clC5p3KHLUr/HFrcFqqO8+X+r+gBgJ0GoCjjnuh4I77CNNaI821SqZl5BDfqKkpHM+urJ78wMvMr8aaRh+3EambNVjebIajoOYEyNegHO8xyuPLK3Jlt2Exzo1Qw1M7zviAAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy3":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5MzGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgDEZ65sG90P2AuiDPUBI4WAAZd3bI9nhNy5mrciDLOE5DM2WiTdmHW+c/8kh7rO2OVtd5FCPdxvEeNqnwFXXH0fPG4Eeo3yLja4CrOHGBq6rBMrm8qW6QHo22aZgScS0/z0oYFeYQLlclBkHW6dKn3Z9w9jSfsmIv0TBz9Zxhy51AAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5MzGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgETHcENEid5VP9bIi/9U8XTDtJ8PB1gHdsv3F9QHMEewX5uRvsUFquuRy9wffvzDsIp4eBmKuBtCDCcRK5vpAt/uGaprP8AoHkMDfUAmNY9hk3Sfcc533dC3SPux3JNGxR1FzV7iVXVfgAW+jNHfQT/l/cnvJyvmmVvtY1mWYW4sAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTMxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYAVv5XSGjhxApqBhCdKlLGRNeSzOBz0WyZWR+ljItRefsm/Clpx5jlGzLbENks25THiS/PvrK3W8ZsiEjkhAXr2JNtrvg1XbHdr5dVgWVXakyEom+cYbDdyuQ4P026bJlhvvmyARshWz8bR829O/3AhbwkyzjBzBaFtkffRXGb8SQAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5MzGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgEXP5eqVkbbaZp7jAqCMcMCwZo9LEwQ5cJUlc+1p6a/3fQzOsDRwkAJPS9TaGr5MICQ+5mmdH9FEVd6XA1vk0ct/bZBwr8AY48OvzkdzJshugn1QRzXJaAakJu3XY7lEj+BpVNGN6mPxKItaNRnomT48c+bBWkg3XRVo5EycpLYBAAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy4":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5NDGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgD9AveXxHzQrD8XDErGJy9G5pWCFFfTCUlU7aOzF3Y+8hn1kczjcZFrNGCOgC7vLOoaqP6dDeQXWBbU7JpwEUFjqrhVhTnPJoiIVctXkliZwx/dq2aI+PZ8+mRbWm4krXquhiM10TuGPjCaLHlY8U4gM/YzR/pfcRjwnE6sGhST4AAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5NDGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgB1W0Zk/c+dDRiY60j9kaeaI9YaraspHTAUn++bX+xlMEe8CrV0YErYd7UzMl8rwyQt7r20fI5C5nMl01mURdwnrDgyWsxvF/AXo7oMhnYpvvjU6aNPz7ZylpsWuu2SiKoG8fWM5fm6tqOx4BXd0kWK26BdR5G497VVLoLWDo2VEAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTQxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYABgElUdaEjgS3HrLTvuM2VM6WjomD6+4anzmBtd9tB9qZ9wtmGmeLMTTfu+Fe/r58cPuJUAS1HeQfncFCEWYvAlxAgcS8cepEXbmmN1DBwGROnIVNwTtmzTAoeRLDRTCUXXta2oWC+VJeY/DITcDUf0BrOY2t9C8elSHAFwlnyfAAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5NDGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgAlWQmuY+e3TJ/063oz4FZDf83hm+2whDML3SGtYTgMNHdU6eqEuqe398I1bbhWuTNcFmhqZvmxTtIodv/c6Wggev9u4d2/u8SQHL7B6w3T5lczV1Dl5dKvQd88Z5gwusubQTAs2r5+EuRZZUO5TUMF9U6tO4X9TC5hu49jXCpEIAAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy5":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5NTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgC2o6Uj4oEZctt8Zp57joCXxvSKEyFkTTy3HMTJqwbD7thIyceIJbuE83gGSfys/qZzXbKGRNukDGMgB0dSMKFq+f997UWJZIlzzvK70rEUCfykvwSP61zTM+tmilR5htl0bCQp0xYoswUcdKvkRZ+HyepVjXcD4sujB4GI2VRYlAAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5NTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgDrBnLEjVnMWlwT2GyRx0oKzkAQz2eRaeZrf3GlK+t5qtY0WNSEwbkucWq0r11A8aw/vEBzz2hCQ3zDQ9kEVpCg41tC7qg9p0NnDzFARY7hO1O6syDxqFVyAWpyEon3SI/s1vm3mSSMgXgNolfhksv9Cm/SWwih7/tpMxQXKnbBxAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTUxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYBH5RCAbwyguqNJAN/qnDLVSVLba6M8bWFevuB/tDV5VYe2U0ND2og8aGRb+y+POoFKahVFNmoMdB634mpPutbdIgK8Q4daqqgnzB5Ra8ehO9D5Ozl01waJYuTvUbVn/7Sr6RrUo77MHln5jwALaAA2M7L5E4Lamd0au9LuxxJILgAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5NTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgFhPw+qiCrqpKMpLUcctj9NeI6nthyLZsf2/ZPJT5p1tcITBYPL9N2Qapxv2KcJh2AoyQ04WsemD3vSQhN+zxtkPItvPDhwlENRYeS+wlHIQDpVoi4e2ZmQY9QHCmaY1g+BAMxlwx/ugi9JRLUl/pmaUttP0TayXS6dfrKNImboDAAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy6":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5NjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgFe97dufuiJatbXeoJ1GdeoUJRmSqf9s18vTqOC1OUGkKj7IHIgpy+aUq4fPEzahs2hXcClV2NL2JTlONxY6b8xbDhwEVBnOeYM4ktw1uYjA5XjOIbJazYHG9ZD1BFLLKYfcvhs9Vjf/SRgCnqC2DlX8xhqZA+W2jJ1xAG2c92fCAAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5NjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgEmU8pgJ83eIQ4P1fs47hqhfplGs3X1nwTy9jXWbu7GcSrSXucjQIgPWo92YIE1mR5eDi6WVIVU5aiztWQpL/6BBNykCMtosPXReFt8N7SwFwg+sDxuRiYS9HYsO+fEpgrDGVIeBSSX0Mr25ic3tx7zXUP7hQhQalIj9J9hQkxBXAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTYxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYBR9IZi90VztdPV0VinBFSwDM7gGJXcqD+OeJoIwZRpuK3Smpe66fTsTPW1FxMCMuCZ9YQO7YGgwAjy8XBqCJ2IkVq1FqLwrZlQVo+07DmPZ44xG075PPrVSiylniApdsRaK2XOsWnP0rKiBQ/WRNKOpwsIZ2+vwJ6BzhgAAjYuAgAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5NjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgAbozST+CTcm+t4UMiB77pTseE4/cWfUMdyjqeHV0bypTp/5fbHUlm4rJ3DrcAllCeoW6Tkl0q+KI1XUWxzXeIGoBsfsqXXXoNCD0U+YLMMprbqplngGvsjNnUK7KtlpQG2yeVMYhfVLr28kV8i7WzgwkpdcCfCcIDYWODJSnkPGAAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy7":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5NzGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgFa3WP/PHox7o7m/IrFcnDXhZ3yXLf+CzDWq3RZDfJCgZGc9A/p8H8CV/OXqdB4a3HKgcPop0VoCzuvXLpN/gzRQ9hGSrWpMkiIoNWmPf++etjyS/Eu6UkyN+dHe9HFDg8VO3L85mwI27DHeYR3/3pnDEAAEyiv4PhzwL/sMXzLIAAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5NzGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgDSYhdU08gWTNsHnM83PS2T8J8BijcwzBVT/IrgF90NYotznIvoQ4Ql0jBm5WDfwL5CTi3fH0yIpPcCJnfDAHhQupu97MHYY4VnXyp2x7mzo3ZJH/Af6wLFsZUTl+QQ2OybwjzByRutFP75RzCMrLn5YZ0d0A3RJHbMBp35Nkb4gAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTcxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYATv3n0QsvqTEcfroQD2ogqOc2FWwKJMJv35YM3V4FziOPrGYt5bYJbK7lJY3Jww3IdOkMBbvDbhydnnYcNALZ/ZhYzHHpiMNZD54wOd0+d3y0uzpQklEE/II5pQhWmTCTAcAuIVcWN7ZQNl/B4gDdyqAtsgcRSwsWhNyaYBkm6ZwAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5NzGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgE5CbTE7WLRxbXIFG45XXnZdkZpuBveohq55PwUx6cBzorKix3QGEnzlZU20FQ0D/bi/JeUOsQJHqaxFed4IheJLCLS3AMDZdbHq9B25wd1TCounAViUhvR8n5K4NDwgSM6Vm+qHZFkVHZ/7WACyCStiK8+BbdmlMgBED7laDmK8AAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy8":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5ODGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgFgbhqnSQd/qLE9DoOK4yOHuEX7+EZFTJgzobQRNVWKSECvOFp6L50CSN6u63w/01rPrKaX+5Ml3jL0ghXQi1NcrWHnE0iEpTlUFRDld4N59fWrr5C5GnGaPPgfCn9jxXXT4yjBODr2x50YM0NvRKBo3xGtEJd0HTEPbiHI3QJueAAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5ODGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgAToKZjGUNcQdR59PTWT+yCuLHBGn6AxUrSMw+CnRShAY3yYBVtyvG771gUJF85Tt19FHtae/k/zN1RGuxJPmtC4cvN+wCTZB3IVCxbZYkqaB4B7Ipp/vygeRkfCpKwc6BiXeXNqHw/cLwKBsWwgLK7+w19I0tCCKFs3L6Q1f84AAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTgxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYAeTCkgtBBNA+B3EPIBrPn+M0Y/kynAYSN7PH/y34FRIWDC+dk1j8Aca1UXtmnuqPoHadtcqKiymzTNpAzhcy0LR6E8hL+c+oVZnzixIV3L3Rwk5clxHTLuX6k5btC6fi/kP6W//aW4S92PR8DozIso0MZ0hpO7k2VjpfCdeeSyQgAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5ODGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgBwAEcChrhdfpCnxLwc3+sxB0nh3mUVJE9l+X3MZnhyu/g7dCDZS/WCrMJKNL+dVvzXfcIv48bfimKnyINJJu+oyqUEGDg3xqFNTYycPlETZcA9PaC6NqEjexTooGG95xNOEy2Dc5/eyXhyMKUptUjBc9DORyDujHsVCQlZoEpNjAAAAAAAA"; //jstestsTempPasswordUser
					break;
				case "_copy9":
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMDIGCSqGSIb3DQEHAaAlBCNqc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcl9jb3B5OTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgBw7CeqblcuAX0B+NNKGEVRezeB+md/tDKwf+AKGBAYmqQ7pFsN+HyCOv3CsL+fdWzxCltUFG1Z2FPJHP55yE4+UPGLBZ2aD6DjdOZI0okyodhXZRjVk9LzvEudBkDVo4/qOT+QckcuWX4NIKgdHocYt+TA9jCLUgTN1/SUpGaEvAAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzTG9ja2VkVXNlcl9jb3B5OTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgEYNDQ0l0PZsTXoTvccuaNIwgzUiD7e53IaDZhxWun1ksLEnrSGTbf1TbNS/UNyfLEo2ltUWv34qGL7U3AQsVekxT2rMg1Tx1M1IDZiwEIpJfZDZ9eUgJ+YSfxhVKrGrDkSJTgfVFd/rnW2FiH/vlnaWjK1OTv8fWFJAzQvcq4saAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCcGCSqGSIb3DQEHAaAaBBhqc3Rlc3RzRXhwaXJlZFVzZXJfY29weTkxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYBYIBOULgFtm0fquU2Yqq/BE71HfAuopbFaltLNb2rJqE08ieka7LFiMaAwXdrQUeJBatSr0VnVf1Np84dJEwqzhtn9U7zmDSQTovzHv81AAoB+022h0zYWQvA+w+LBCshlttG/SrTGW8zXw7z4rsermWZTvsNis2qeaNhoZ4Ep2AAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcl9jb3B5OTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgCfE4hyTesdN0blXeQldfkrbduwraV8WYJQYOaF2HfVkhd6KpgFE657bRzmcb/u9D/DqTb8BwHmgT4Pd3od0Lp5EJm6IbI6jiphRLPc5k9xFiT24HvE+1X3IK7UIKm7u3T2XkuoZqgist1mPjfFejH7HI5xygRQA0KNdInDmI0ZNAAAAAAAA"; //jstestsTempPasswordUser
					break;
				default:
					this.encryptedJstestsMustChangePasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCwGCSqGSIb3DQEHAaAfBB1qc3Rlc3RzTXVzdENoYW5nZVBhc3N3b3JkVXNlcjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgAOOj/SRmYBaMPiq5enWrbsxwTP1OYrdtwPCNTcZtrE7pYgZLFoRqJm5mc2uU2KenTayp/p38csUHl0FJUQxX6Ek6X+2rm7if/KzZ3yn5COZw005i8ZfZqqwR/BTK9PwidnlngM6xtWoJGBk0W3rA8/00X/BYIQra4k4i5QWkbK6AAAAAAAA"; //jstestsMustChangePasswordUser
					this.encryptedJstestsLockedUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCAGCSqGSIb3DQEHAaATBBFqc3Rlc3RzTG9ja2VkVXNlcjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgA7FLUFBfMfStdqplDQcW0/LsweSabdoDBBXPwu9PMvgNGkVuTTGwT2xODlZe64RtPIczi2nWsZF7UAZIBvqN67gmLT/8ci68bqEgydpu2Y/EhqQ1ywuZJ9TPVplds3sWzakimGWPiz5cnMKi3xhJ2FiMY9T6g1KUUBaQexKw2KRAAAAAAAA"; //jstestsLockedUser
					this.encryptedJstestsExpiredUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCEGCSqGSIb3DQEHAaAUBBJqc3Rlc3RzRXhwaXJlZFVzZXIxgeMwgeACAQEwPjApMQswCQYDVQQGEwJVUzEaMBgGA1UEAxMRRWxkb1MgQ29ycG9yYXRpb24CEQCrtsUTBdxgSI+jNYNFp+amMAkGBSsOAwIaBQAwDQYJKoZIhvcNAQEBBQAEgYAOG+5qrRmCXt+phCBdr6He3324+9VdTazdW0q/4w4wBhDjoPxCFTs1zAV0y7/xKC9evBQJ8VOSbqMF6y35dUE9JE+Onlqu/KL7aM9KO+xLWy45uGF3d+LBoWOXXaQqT9k6XK+HnSoKyCCFIJvD/+EefD8c7PQUyhw1bN42rJmNwwAAAAAAAA=="; //jstestsExpiredUser
					this.encryptedJstestsTempPasswordUser = "MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCYGCSqGSIb3DQEHAaAZBBdqc3Rlc3RzVGVtcFBhc3N3b3JkVXNlcjGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgACHR/cXgzJAb2g4o/zFkZzuGu2M3wUx2Clwp/i7Nl8kqzGG5CF8CHl8ynYuBbiYq8PX7RZDSaUCpOGkd8ONfSNrk2diTxu/FrAI7oW+EFZ16GJMYH89V7MFpTGqeRbyUvph6pv+FgI2zB93SPm6Un4nM35odXIoscU2uRwThqHHAAAAAAAA"; //jstestsTempPasswordUser
					break;
			}
			this.originalSessionId = envianceSdk.getSessionId();
			this.originalSystemId = envianceSdk.getSystemId();
		},
		teardown: function() {
			envianceSdk.configure({
				sessionId: this.originalSessionId,
				systemId: this.originalSystemId
			});
		}
	});

	asyncTest("Authenticate - Happy path", 4, function () {
		var self = this;
		envianceSdk.authentication.authenticate(this.accessUserName, this.password,
			function(response) {
				equal(response.metadata.statusCode, 201, "Status code is correct");
				ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
				notEqual(envianceSdk.getSessionId(), this.originalSessionId, "Session ID has changed");
				equal(envianceSdk.getSystemId(), null, "System ID is null");
				start();
			},
			self.errorHandler);
	});

	asyncTest("Authenticate - Fault if no user name specified", 3, function () {
		var self = this;
		envianceSdk.authentication.authenticate("", this.password,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				equal(response.error.details[0].key, "UserName", "userName parameter validation failed");
				start();
			});
	});

	asyncTest("Authenticate - Fault if user must change password", 3, function () {
		var self = this;
		envianceSdk.authentication.authenticate(this.mustChangePasswordUser, this.password,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 401, "Status code is correct");
				equal(response.error.errorNumber, 1001, "Error number is correct");
				equal(response.error.securityTokenStatus, 16, "Security token status is correct");
				start();
			});
	});

	asyncTest("Authenticate - Fault when wrong MIME Type", 2, function () {
		var self = this;
		var ajaxSettings = {
			type: "POST",
			contentType: "application/x-www-form-urlencoded",
			url: envianceSdk._private._buildUrl('ver2/AuthenticationService.svc/sessions'),
			data: envianceSdk.JSON.stringify({ userName: this.accessUserName, password: this.password })
		};
		envianceSdk._private._ajax(ajaxSettings,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 500, "Status code is correct");
				equal(response.error.message, "MIME Type 'application/x-www-form-urlencoded' doesn't match the request which is JSON.");
				start();
			});
	});
	

	asyncTest("Authenticate - Fault if user with temporary password", 3, function () {
		var self = this;
		envianceSdk.authentication.authenticate(this.tempPasswordUser, "2222",
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 401, "Status code is correct");
				equal(response.error.errorNumber, 1001, "Error number is correct");
				equal(response.error.securityTokenStatus, 8192, "Security token status is correct");
				start();
			});
	});

	asyncTest("Get session info - Happy path", 12, function () {
		var self = this;
		envianceSdk.authentication.getCurrentSession(
			function(response) {
				equal(response.metadata.statusCode, 200, "Status code is correct");

				ok(response.result.hasOwnProperty("id"), "id property presents");
				ok(response.result.hasOwnProperty("homeSystemId"), "homeSystemId property presents");
				ok(response.result.hasOwnProperty("currentSystemId"), "currentSystemId property presents");
				ok(response.result.hasOwnProperty("systems"), "systems property presents");
				ok(response.result.hasOwnProperty("sessionTimeout"), "sessionTimeout property presents");
				ok(response.result.hasOwnProperty("userTimeZone"), "userTimeZone property presents");

				ok(response.result.userTimeZone.hasOwnProperty("name"), "userTimeZone.name property presents");
				ok(response.result.userTimeZone.hasOwnProperty("stdOffset"), "userTimeZone.stdOffset property presents");
				ok(response.result.userTimeZone.hasOwnProperty("dstOffset"), "userTimeZone.dstOffset property presents");
				ok(response.result.userTimeZone.hasOwnProperty("currentOffset"), "userTimeZone.currentOffset property presents");

				equal(response.result.id, envianceSdk.getSessionId(), "Session ID OK");

				start();
			},
			self.errorHandler);
	});

	asyncTest("AuthenticateByCert - Happy path", 4, function() {
		var self = this;
		envianceSdk.authentication.authenticateByCert(this.encryptedJstestsAccessUser, this.certificateUniqueId,
			function(response) {
				equal(response.metadata.statusCode, 201, "Status code is correct");
				ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
				notEqual(envianceSdk.getSessionId(), this.originalSessionId, "Session ID has changed");
				equal(envianceSdk.getSystemId(), null, "System ID is null");
				start();
			},
			self.errorHandler);
	});

	asyncTest("AuthenticateByCert - Fault if no user name specified", 3, function() {
		var self = this;
		envianceSdk.authentication.authenticateByCert("", this.certificateUniqueId,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				equal(response.error.details[0].key, "EncryptedUserName", "encryptedUserName parameter validation failed");
				start();
			});
	});

	asyncTest("AuthenticateByCert - Fault if certificateId not specified", 3, function () {
		var self = this;
		envianceSdk.authentication.authenticateByCert(this.encryptedJstestsAccessUser, "",
			self.errorHandler,
			function (response) {
				equal(response.metadata.statusCode, 400, "Status code is correct");
				equal(response.error.errorNumber, 100, "Error number is correct");
				equal(response.error.details[0].key, "CertUniqueId", "certUniqueId parameter validation failed");
				start();
			});
	});

	asyncTest("AuthenticateByCert - Fault if certificateId not found in System Storage", 2, function() {
		var self = this;
		envianceSdk.authentication.authenticateByCert(this.encryptedJstestsAccessUser, this.certificateUniqueId + "X",
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 500, "Status code is correct");
				ok(response.error.hasOwnProperty("message"), "message property presents");
				start();
			});
	});

	asyncTest("AuthenticateByCert - Fault if user Name not found", 1, function () {
		var self = this;
		envianceSdk.authentication.authenticateByCert("MIAGCSqGSIb3DQEHAqCAMIACAQExCzAJBgUrDgMCGgUAMCkGCSqGSIb3DQEHAaAcBBpWaW5uaWVUaGVQb29oUnVsZXNUaGVTdGF0ZTGB4zCB4AIBATA+MCkxCzAJBgNVBAYTAlVTMRowGAYDVQQDExFFbGRvUyBDb3Jwb3JhdGlvbgIRAKu2xRMF3GBIj6M1g0Wn5qYwCQYFKw4DAhoFADANBgkqhkiG9w0BAQEFAASBgBL9xIf2VHNDVDtxmtquhE508XSKaIvX/mGltyEAS3U06jZ70CnqFGyQGyCwfFuHxR4ZhLn6YYPAf2aLOKSXmv82DLVZCstHRT1q+Hb7FaqpQ60vXDWu1ymYVhgN++FrfFFPUVoKFx4WFa7L1FHPN+s/MoVsAP7enXDCp7jxpHkqAAAAAAAA",
			this.certificateUniqueId,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 401, "Status code is correct");
				start();
			});
	});

	asyncTest("AuthenticateByCert - Fault if user name is not valid encrypted name", 2, function () {
		var self = this;
		envianceSdk.authentication.authenticateByCert(this.accessUserName, this.certificateUniqueId,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 500, "Status code is correct");
				ok(response.error.hasOwnProperty("message"), "message property presents");
				start();
			});
	});

	asyncTest("AuthenticateByCert - Happy path - User must change Password", 4, function () {
		var self = this;
		
		var n = Base64.decode(this.encryptedJstestsMustChangePasswordUser);

		envianceSdk.authentication.authenticateByCert(this.encryptedJstestsMustChangePasswordUser, this.certificateUniqueId,
			function(response) {
				equal(response.metadata.statusCode, 201, "Status code is correct");
				ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
				notEqual(envianceSdk.getSessionId(), this.originalSessionId, "Session ID has changed");
				equal(envianceSdk.getSystemId(), null, "System ID is null");
				start();
			},
			self.errorHandler);
	});

	asyncTest("AuthenticateByCert - Fault if user expired", 3, function () {
		var self = this;
		envianceSdk.authentication.authenticateByCert(this.encryptedJstestsExpiredUser, this.certificateUniqueId,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 401, "Status code is correct");
				equal(response.error.errorNumber, 1001, "Error number is correct");
				equal(response.error.securityTokenStatus, 64, "Security token status is correct");
				start();
			});
	});

	asyncTest("AuthenticateByCert - Fault if user locked", 3, function () {
		var self = this;
		envianceSdk.authentication.authenticateByCert(this.encryptedJstestsLockedUser, this.certificateUniqueId,
			self.errorHandler,
			function(response) {
				equal(response.metadata.statusCode, 401, "Status code is correct");
				equal(response.error.errorNumber, 1001, "Error number is correct");
				equal(response.error.securityTokenStatus, 256, "Security token status is correct");
				start();
			});
	});

	asyncTest("AuthenticateByCert - Happy path - User with Temporary Password", 4, function () {
		var self = this;
		envianceSdk.authentication.authenticateByCert(this.encryptedJstestsTempPasswordUser, this.certificateUniqueId,
			function(response) {
				equal(response.metadata.statusCode, 201, "Status code is correct");
				ok(response.metadata.hasOwnProperty("location"), "Location is not empty");
				notEqual(envianceSdk.getSessionId(), this.originalSessionId, "Session ID has changed");
				equal(envianceSdk.getSystemId(), null, "System ID is null");
				start();
			},
			self.errorHandler);
	});

	asyncTest("EndCurrentSession - Happy path", 2, function() {
		var queue = new ActionQueue(this);

		queue.enqueue(function(context) {
			envianceSdk.authentication.authenticate(context.accessUserName, context.password,
				function(response) {
					equal(response.metadata.statusCode, 201, "Status code is correct");
					queue.executeNext();
				},
				self.errorHandler);
		});

		queue.enqueue(function() {
			envianceSdk.authentication.endCurrentSession(
				function(response) {
					equal(response.metadata.statusCode, 204, "Status code is correct");
					start();
				},
				self.errorHandler);
		});

		queue.executeNext();
	});
}

if (typeof (UnitTestsApplication) == "undefined") {
	executeAuthenticationTests();
}