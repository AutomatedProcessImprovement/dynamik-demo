import os
import typing


def write_to_file(folder: str, filename: str, content: str):
    base_path = os.environ.get('BASE_DATA_PATH', os.path.join('..', '..', 'dynamik-data'))
    folder_path = os.path.join(base_path, folder)
    full_path = os.path.join(folder_path, filename)

    if not os.path.exists(folder_path):
        os.makedirs(folder_path)

    with open(full_path, 'w') as f:
        f.write(content)

    return filename


def read_from_file(folder: str, filename: str, transform: typing.Callable[[str], any]):
    base_path = os.environ.get('BASE_DATA_PATH', os.path.join('..', '..', 'dynamik-data'))
    folder_path = os.path.join(base_path, folder)
    full_path = os.path.join(folder_path, filename)

    if os.path.exists(full_path):
        with open(full_path, 'r') as f:
            return transform(f.read())
    else:
        raise IOError(f'file {full_path} does not exist')
