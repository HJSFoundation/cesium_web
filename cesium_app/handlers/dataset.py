from baselayer.app.handlers.base import BaseHandler, AccessError
from ..models import DBSession, Project, Dataset, DatasetFile
from .. import util

from cesium import data_management, time_series
from cesium.util import shorten_fname

import os
from os.path import join as pjoin
import uuid

import tornado.web


class DatasetHandler(BaseHandler):
    @tornado.web.authenticated
    def post(self):
        if not 'tarFile' in self.request.files:
            return self.error('No tar file uploaded')

        zipfile = self.request.files['tarFile'][0]

        if zipfile.filename == '':
            return self.error('Empty tar file uploaded')

        dataset_name = self.get_argument('datasetName')
        project_id = self.get_argument('projectID')

        zipfile_name = (str(uuid.uuid4()) + "_" +
                        util.secure_filename(zipfile.filename))
        zipfile_path = pjoin(self.cfg['paths:upload_folder'], zipfile_name)

        with open(zipfile_path, 'wb') as f:
            f.write(zipfile['body'])

        # Header file is optional for unlabled data w/o metafeatures
        if 'headerFile' in self.request.files:
            headerfile = self.request.files['headerFile'][0]
            headerfile_name = (str(uuid.uuid4()) + "_" +
                               util.secure_filename(headerfile.filename))
            headerfile_path = pjoin(self.cfg['paths:upload_folder'], headerfile_name)

            with open(headerfile_path, 'wb') as f:
                f.write(headerfile['body'])

        else:
            headerfile_path = None

        p = Project.query.filter(Project.id == project_id).one()
        ts_paths = data_management.parse_and_store_ts_data(
            zipfile_path,
            self.cfg['paths:ts_data_folder'],
            headerfile_path)
        meta_features = list(time_series.load(ts_paths[0]).meta_features.keys())
        unique_ts_paths = [os.path.join(os.path.dirname(ts_path),
                                        str(uuid.uuid4()) + "_" +
                                        util.secure_filename(ts_path))
                           for ts_path in ts_paths]
        d = Dataset(name=dataset_name, project=p, meta_features=meta_features)
        for old_path, new_path in zip(ts_paths, unique_ts_paths):
            os.rename(old_path, new_path)
            d.files.append(DatasetFile(name=shorten_fname(old_path),
                                       uri=new_path))
        DBSession().add(d)
        DBSession().commit()

        return self.success(d, 'cesium/FETCH_DATASETS')

    @tornado.web.authenticated
    def get(self, dataset_id=None):
        if dataset_id is not None:
            dataset = Dataset.get_if_owned_by(dataset_id, self.current_user)
            dataset_info = dataset.display_info()
        else:
            datasets = [d for p in self.current_user.projects
                        for d in p.datasets]
            dataset_info = [d.display_info() for d in datasets]

        return self.success(dataset_info)

    @tornado.web.authenticated
    def delete(self, dataset_id):
        d = Dataset.get_if_owned_by(dataset_id, self.current_user)
        DBSession().delete(d)
        DBSession().commit()
        return self.success(action='cesium/FETCH_DATASETS')
