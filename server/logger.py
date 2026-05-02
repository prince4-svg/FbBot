import json


def log(data) -> None:
	print("\n======[ REQUEST ]======")
	print(json.dumps(data, indent=4))