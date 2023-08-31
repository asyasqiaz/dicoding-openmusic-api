const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, validator, storageService) {
    this._service = service;
    this._validator = validator;
    this._storageService = storageService;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      message: 'Album added successfully',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    const response = h.response({
      status: 'success',
      message: 'Successfully obtained the album',
      data: {
        album,
      },
    });
    response.code(200);
    return response;
  }

  async putAlbumByIdHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album updated successfully',
    };
  }

  async deleteAlbumByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);
    return {
      status: 'success',
      message: 'Album deleted succesfully',
    };
  }

  async postAlbumCoverByIdHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    this._validator.validateAlbumCoverPayload(cover.hapi.headers);

    await this._service.getAlbumById(id);

    const filename = await this._storageService.writeFile(cover, cover.hapi);

    await this._service.updateAlbumCoverById(
      id,
      `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`,
    );

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async getAlbumLikesByIdHandler(request, h) {
    const { id } = request.params;
    await this._service.verifyAlbumAvailability(id);
    const data = await this._service.getAlbumLikesById(id);

    const { likes, source } = data;

    const response = h.response({
      status: 'success',
      data: {
        likes: parseInt(likes),
      },
    });
    response.code(200);
    response.header('X-Data-Source', source);
    return response;
  }

  async postAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.verifyAlbumAvailability(id);

    await this._service.addAlbumLikeById(userId, id);

    const response = h.response({
      status: 'success',
      message: 'Like added successfully',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikeByIdHandler(request, h) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.deleteAlbumLikeById(userId, id);
    const response = h.response({
      status: 'success',
      message: 'Like deleted succesfully',
    });
    response.code(200);
    return response;
  }
}

module.exports = AlbumsHandler;
