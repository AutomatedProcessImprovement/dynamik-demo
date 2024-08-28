import dataclasses
import json
import traceback
import typing
from datetime import datetime, timedelta
from dynamik.model import Serializable
from dynamik.utils.pm.calendars import Calendar

from runner.model import ExecutionStatus, DriftDetails


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        try:
            if isinstance(o, ExecutionStatus):
                return o.asdict()
            if isinstance(o, DriftDetails):
                return o.asdict()
            if isinstance(o, Serializable):
                return o.asdict()
            if isinstance(o, Calendar):
                return o.asdict()
            if isinstance(o, datetime):
                return o.isoformat()
            if isinstance(o, timedelta):
                return o.total_seconds()
            if isinstance(o, typing.Iterable):
                return [_o for _o in o]
            if dataclasses.is_dataclass(o):
                return dataclasses.asdict(o)
            return super().default(o)
        except Exception as e:
            traceback.print_exception(e)
