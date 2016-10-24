{
  "targets": [
    {
      "target_name": "my_extension",
      "sources": ["my_extension.cc", "md.cc"],
	  "include_dirs" : ["<!(node -e \"require('nan')\")"]
    }
  ]
}