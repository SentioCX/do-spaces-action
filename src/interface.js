const { Upload } = require('@aws-sdk/lib-storage')
const { S3 } = require('@aws-sdk/client-s3')

const fs = require('fs')
const { lookup } = require('mime-types')
const core = require('@actions/core')

class S3Interface {
	constructor(config) {
		this.bucket = config.bucket
		this.permission = config.permission
		this.gzipFileTypes = config.gzipFileTypes

		core.debug(`Creating S3 client for bucket ${ this.bucket }`)
		core.debug(`Using permission ${ this.permission }`)
		core.debug(`Using gzip file types ${ this.gzipFileTypes }`)

		const spacesEndpoint = new URL(`${ config.region }.digitaloceanspaces.com`)
		const s3 = new S3({
			endpoint: spacesEndpoint,
			credentials: {
				accessKeyId: config.access_key,
				secretAccessKey: config.secret_key
			}
		})

		this.s3 = s3
	}

	async upload(file, path) {
		const fileStream = fs.createReadStream(file)

		const contentType = lookup(file) || 'text/plain'
		const params = {
			Body: fileStream,
			Bucket: this.bucket,
			Key: path.replace(/\\/g, '/'),
			ACL: this.permission,
			ContentType: contentType
		}

		const isMatchingGzipFileType = this.gzipFileTypes.some((fileType) => fileType === contentType)
		core.debug(`File name = ${ file } with content type = ${ contentType } is matching gzip file type ${ isMatchingGzipFileType }`)
		if (isMatchingGzipFileType) {
			params.ContentEncoding = 'gzip'
		}

		await new Upload({
			client: this.s3,
			params
		}).done()
	}
}

module.exports = S3Interface