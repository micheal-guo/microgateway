'use strict';

var fs        = require('fs');
var express   = require('express');
var supertest = require('supertest');
var echo      = require('./support/echo-server');
var policyLoader  = require('../lib/policy-loader');
var should        = require('should');
var path          = require('path');

describe('policy-loader', function() {
    describe('load default policy', function() {
        it('should contains cors, invoke, redaction set-variable', function() {
            var pl = policyLoader.create(path.resolve(__dirname, '..', 'policies'));
            pl.should.be.a.Object();
            var policies = pl.getPolicies();
            policies.should.have.property('cors');
            policies.should.have.property('invoke');
            policies.should.have.property('set-variable');
            policies['cors'].should.be.a.Function();
            policies['invoke'].should.be.a.Function();
            policies['set-variable'].should.be.a.Function();
        });
    });
    describe('multiple locations', function() {
        it('should load policies in location1 and location2', function() {
            var paths = [
                path.resolve(__dirname, 'definitions',
                        'policy-loader', 'location1'),
                path.resolve(__dirname, 'definitions',
                        'policy-loader', 'location2')
            ];
            var pl = policyLoader.create(paths);
            pl.should.be.a.Object();
            var policies = pl.getPolicies();
            policies.should.have.property('mypolicy1');
            policies.should.have.property('mypolicy2');
            policies.should.have.property('mypolicy3');
            policies.should.have.property('mypolicy4');
            policies['mypolicy1'].should.be.a.Function();
            policies['mypolicy2'].should.be.a.Function();
            policies['mypolicy3'].should.be.a.Function();
            policies['mypolicy4'].should.be.a.Function();
            var context = {};
            function next() {};
            policies.mypolicy1({}, context, next);
            //the second mypolicy1 override the first one
            context.policyName.should.exactly('mypolicy1a').and.be.a.String();
            policies.mypolicy2({}, context, next);
            context.policyName.should.exactly('mypolicy2').and.be.a.String();
            policies.mypolicy3({}, context, next);
            context.policyName.should.exactly('mypolicy3').and.be.a.String();
            policies.mypolicy4({}, context, next);
            context.policyName.should.exactly('mypolicy4').and.be.a.String();
        });
    });
    describe('error cases', function() {
        it('should throw error if not abs path', function() {
            should.throws(function() {
                policyLoader.create(path.resolve('..', 'policies'));
            });
        });
        it('should throw error if path is incorrect', function() {
            should.throws(function() {
                policyLoader.create(path.resolve(__dirname, 'policies'));
            });
        });
    });

    describe('use APIC_CONFIG_PATH to load policies', function() {
        before(function(done) {
          process.env.APIC_CONFIG_PATH = __dirname + '/definitions/policy-loader';
          done();
        });

        after(function(done) {
          delete process.env.APIC_CONFIG_PATH;
          done();
        });

        it('should load user policies in config correctly', function(done) {
            var loader = policyLoader.createMGLoader();
            var policies = loader.getPolicies();
            policies.should.have.property('cors');
            policies.should.have.property('invoke');
            policies.should.have.property('set-variable');
            policies['cors'].should.be.a.Function();
            policies['invoke'].should.be.a.Function();
            policies['set-variable'].should.be.a.Function();
            policies.should.have.property('mypolicy1');
            policies.should.have.property('mypolicy2');
            policies.should.have.property('mypolicy3');
            policies.should.have.property('mypolicy4');
            policies['mypolicy1'].should.be.a.Function();
            policies['mypolicy2'].should.be.a.Function();
            policies['mypolicy3'].should.be.a.Function();
            policies['mypolicy4'].should.be.a.Function();

            var context = {};
            function next() {};
            policies.mypolicy1({}, context, next);
            //the second mypolicy1 override the first one
            context.policyName.should.exactly('mypolicy1a').and.be.a.String();
            done();
        });

        it('should load user policies in config and disable override', function(done) {
            var loader = policyLoader.createMGLoader({'override':false});
            var policies = loader.getPolicies();
            policies.should.have.property('cors');
            policies.should.have.property('invoke');
            policies.should.have.property('set-variable');
            policies['cors'].should.be.a.Function();
            policies['invoke'].should.be.a.Function();
            policies['set-variable'].should.be.a.Function();
            policies.should.have.property('mypolicy1');
            policies.should.have.property('mypolicy2');
            policies.should.have.property('mypolicy3');
            policies.should.have.property('mypolicy4');
            policies['mypolicy1'].should.be.a.Function();
            policies['mypolicy2'].should.be.a.Function();
            policies['mypolicy3'].should.be.a.Function();
            policies['mypolicy4'].should.be.a.Function();

            var context = {};
            function next() {};
            policies.mypolicy1({}, context, next);
            //the second mypolicy1 can't override the first one
            context.policyName.should.exactly('mypolicy1').and.be.a.String();
            done();
        });
      });

    describe('use projectDir to load policies', function() {

        var cwd = process.cwd();
        var testdir = path.resolve(__dirname, 'definitions', 'policy-loader');
        before(function(done) {
            process.chdir(testdir);
            done();
        });

        after(function(done) {
          process.chdir(cwd);
            done();
        });

        it('should load user policies in config correctly', function(done) {
            var loader = policyLoader.createMGLoader();
            var policies = loader.getPolicies();
            policies.should.have.property('cors');
            policies.should.have.property('invoke');
            policies.should.have.property('set-variable');
            policies['cors'].should.be.a.Function();
            policies['invoke'].should.be.a.Function();
            policies['set-variable'].should.be.a.Function();
            policies.should.have.property('mypolicy1');
            policies.should.have.property('mypolicy2');
            policies.should.have.property('mypolicy3');
            policies.should.not.have.property('mypolicy4');
            policies['mypolicy1'].should.be.a.Function();
            policies['mypolicy2'].should.be.a.Function();
            policies['mypolicy3'].should.be.a.Function();

            var context = {};
            function next() {};
            policies.mypolicy1({}, context, next);
            //the second mypolicy1 override the first one
            context.policyName.should.exactly('mypolicy1').and.be.a.String();
            done();
        });
      });
});
